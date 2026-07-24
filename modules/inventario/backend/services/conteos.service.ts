import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, physical_counts } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  ConteoFisicoRepository,
  type ConteoConLineas,
} from '../repositories/conteo-fisico.repository';
import { StockRepository } from '../repositories/stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { MotivoAjusteRepository } from '../repositories/motivo-ajuste.repository';
import { AjustesService } from './ajustes.service';
import { ConteoFisico } from '../entities/conteo-fisico.entity';
import { ProductoInvalidoException, AlmacenInvalidoException } from './movimientos.service';
import type { CrearConteoInput } from '../validators/conteos.schema';

/** Cantidad máxima de filas de `stock` consideradas al autogenerar líneas — techo pragmático, no un segundo mecanismo de paginación real (`ConteosService §"generar líneas"`). */
const TOPE_AUTOGENERACION = 10000;
const MOTIVO_DIFERENCIA_CONTEO = 'Diferencia de Conteo';

export class ConteoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('CONTEO_NO_ENCONTRADO', `No existe el conteo físico "${id}".`, 404);
  }
}

export class TransicionConteoInvalidaException extends DomainException {
  constructor(estadoActual: string, destino: string) {
    super(
      'TRANSICION_CONTEO_INVALIDA',
      `No se puede pasar el conteo de "${estadoActual}" a "${destino}".`,
      409,
    );
  }
}

export class LineaConteoNoEncontradaException extends DomainException {
  constructor(lineaId: string) {
    super('LINEA_CONTEO_NO_ENCONTRADA', `No existe la línea de conteo "${lineaId}".`, 404);
  }
}

export class ConteoSinStockException extends DomainException {
  constructor(warehouseId: string) {
    super(
      'CONTEO_SIN_STOCK',
      `El almacén "${warehouseId}" no tiene stock con existencia > 0 para autogenerar líneas — indicar productIds explícitamente.`,
      400,
    );
  }
}

export class ZonaInvalidaException extends DomainException {
  constructor(zoneId: string, warehouseId: string) {
    super(
      'ZONA_INVALIDA',
      `No existe la zona "${zoneId}", o no pertenece al almacén "${warehouseId}".`,
      400,
    );
  }
}

export class ConteoIncompletoException extends DomainException {
  constructor(id: string) {
    super(
      'CONTEO_INCOMPLETO',
      `El conteo "${id}" tiene líneas sin capturar — no se puede completar todavía.`,
      409,
    );
  }
}

export class MotivoDiferenciaConteoNoConfiguradoException extends DomainException {
  constructor() {
    super(
      'MOTIVO_DIFERENCIA_CONTEO_NO_CONFIGURADO',
      `No existe el motivo "${MOTIVO_DIFERENCIA_CONTEO}" para este tenant — correr scripts/seed-stock-adjustment-reasons.ts primero.`,
      409,
    );
  }
}

/**
 * Conteos físicos (`inventory.physical_counts` + `physical_count_lines`)
 * — flujo real: `planned → in_progress` (captura) `→ completed`
 * (`INVENTORY_PHYSICAL_COUNTS.md §3`). Completar exige que todas las
 * líneas tengan `counted_quantity` capturado; si hay discrepancias,
 * genera automáticamente un `AjusteStock` en borrador (motivo
 * "Diferencia de Conteo") — el ajuste todavía necesita confirmarse
 * aparte (`AjustesService.confirmar`), esta parte no lo confirma sola:
 * la revisión humana antes de tocar `stock` de verdad es el punto — ver
 * `INVENTORY_PHYSICAL_COUNTS.md §4`.
 *
 * "Conteo ciego": `capturarLinea` nunca devuelve `system_quantity` en su
 * respuesta — quien captura no ve la cantidad esperada. "Reconteo": no
 * es un estado especial, es crear un `physical_count` nuevo para el
 * mismo almacén después de que el primero se completó con diferencias.
 */
@Injectable()
export class ConteosService {
  constructor(
    private readonly conteoRepository: ConteoFisicoRepository,
    private readonly stockRepository: StockRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly zonaAlmacenRepository: ZonaAlmacenRepository,
    private readonly motivoAjusteRepository: MotivoAjusteRepository,
    private readonly ajustesService: AjustesService,
  ) {}

  async crear(context: UserContext, input: CrearConteoInput): Promise<ConteoConLineas> {
    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    if (input.zoneId) {
      const zona = await this.zonaAlmacenRepository.findById(context, { id: input.zoneId });
      if (!zona || zona.warehouse_id !== input.warehouseId) {
        throw new ZonaInvalidaException(input.zoneId, input.warehouseId);
      }
    }

    const lineas = input.productIds
      ? await this.resolverLineasExplicitas(context, input.warehouseId, input.productIds)
      : await this.autogenerarLineas(context, input.warehouseId, input.zoneId);

    new ConteoFisico('pendiente', input.warehouseId, input.scheduledDate, lineas); // valida invariantes antes de tocar la base

    return this.conteoRepository.crear(context, {
      companyId: almacen.company_id,
      branchId: almacen.branch_id,
      warehouseId: input.warehouseId,
      scheduledDate: input.scheduledDate,
      lines: lineas,
    });
  }

  private async resolverLineasExplicitas(
    context: UserContext,
    warehouseId: string,
    productIds: string[],
  ): Promise<Array<{ productId: string; systemQuantity: number }>> {
    const lineas = [];
    for (const productId of productIds) {
      const productoValido = await this.productoLookupRepository.existeProducto(context, productId);
      if (!productoValido) throw new ProductoInvalidoException(productId);

      const fila = await this.stockRepository.obtener(context, {
        productId,
        warehouseId,
        locationId: null,
      });
      lineas.push({ productId, systemQuantity: fila ? Number(fila.quantity_on_hand) : 0 });
    }
    return lineas;
  }

  private async autogenerarLineas(
    context: UserContext,
    warehouseId: string,
    zoneId?: string,
  ): Promise<Array<{ productId: string; systemQuantity: number }>> {
    const resultado = await this.stockRepository.listar(
      context,
      {
        warehouse_id: warehouseId,
        quantity_on_hand: { gt: 0 },
        ...(zoneId && { warehouse_locations: { zone_id: zoneId } }),
      },
      { page: 1, pageSize: TOPE_AUTOGENERACION },
    );
    if (resultado.data.length === 0) throw new ConteoSinStockException(warehouseId);
    return resultado.data.map((fila) => ({
      productId: fila.product_id,
      systemQuantity: Number(fila.quantity_on_hand),
    }));
  }

  async obtener(context: UserContext, id: string): Promise<ConteoConLineas> {
    const conteo = await this.conteoRepository.obtener(context, id);
    if (!conteo) throw new ConteoNoEncontradoException(id);
    return conteo;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.physical_countsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<physical_counts>> {
    return this.conteoRepository.listar(context, filter, pagination);
  }

  async iniciar(context: UserContext, id: string): Promise<physical_counts> {
    const conteo = await this.obtener(context, id);
    if (conteo.status !== 'planned') {
      throw new TransicionConteoInvalidaException(conteo.status, 'in_progress');
    }
    return this.conteoRepository.actualizarEstado(context, id, 'in_progress');
  }

  /** Captura ciega: nunca expone `system_quantity` en el resultado. */
  async capturarLinea(
    context: UserContext,
    id: string,
    lineaId: string,
    countedQuantity: number,
  ): Promise<{ id: string; productId: string; countedQuantity: number }> {
    const conteo = await this.obtener(context, id);
    if (conteo.status !== 'in_progress') {
      throw new TransicionConteoInvalidaException(conteo.status, 'capturado');
    }
    const linea = conteo.physical_count_lines.find((l) => l.id === lineaId);
    if (!linea) throw new LineaConteoNoEncontradaException(lineaId);

    const actualizada = await this.conteoRepository.capturarLinea(
      context,
      lineaId,
      countedQuantity,
    );
    return {
      id: actualizada.id,
      productId: actualizada.product_id,
      countedQuantity: Number(actualizada.counted_quantity),
    };
  }

  async completar(
    context: UserContext,
    id: string,
  ): Promise<{ conteo: physical_counts; ajusteGeneradoId: string | null }> {
    const conteo = await this.obtener(context, id);
    if (conteo.status !== 'in_progress') {
      throw new TransicionConteoInvalidaException(conteo.status, 'completed');
    }

    const sinCapturar = conteo.physical_count_lines.filter((l) => l.counted_quantity === null);
    if (sinCapturar.length > 0) throw new ConteoIncompletoException(id);

    const discrepancias = conteo.physical_count_lines.filter(
      (l) => Number(l.counted_quantity) !== Number(l.system_quantity),
    );

    let ajusteGeneradoId: string | null = null;
    if (discrepancias.length > 0) {
      const motivo = await this.motivoAjusteRepository.findMany(
        context,
        { name: MOTIVO_DIFERENCIA_CONTEO } as InventoryPrisma.stock_adjustment_reasonsWhereInput,
        { page: 1, pageSize: 1 },
      );
      const reasonId = motivo.data[0]?.id;
      if (!reasonId) throw new MotivoDiferenciaConteoNoConfiguradoException();

      const ajuste = await this.ajustesService.crear(context, {
        warehouseId: conteo.warehouse_id,
        reasonId,
        lines: discrepancias.map((l) => ({
          productId: l.product_id,
          newQuantity: Number(l.counted_quantity),
        })),
      });
      ajusteGeneradoId = ajuste.id;
    }

    const actualizado = await this.conteoRepository.actualizarEstado(context, id, 'completed');
    return { conteo: actualizado, ajusteGeneradoId };
  }
}
