import { Button } from '@gorazus/ui-kit';

export interface CategoriaPosVista {
  id: string;
  name: string;
}

/**
 * Barra de categorías — preparada para datos reales, pero hoy no existe
 * un endpoint de categorías con alcance POS: `/productos/categorias`
 * exige el permiso de gestión (`productos.gestionar_productos`), distinto
 * del que ya tiene un cajero (`pos.operar_pos`), y `/pos/productos` no
 * acepta filtro de categoría. Llamar a ese endpoint desde acá rompería
 * para cualquier usuario que solo tenga el rol de caja. Hasta que exista
 * una API de categorías propia del POS, este componente recibe `undefined`
 * y no renderiza nada — no se inventa una lista de categorías falsa.
 */
export function CategoryChips({
  categorias,
  categoriaActivaId,
  onSelect,
}: {
  categorias: CategoriaPosVista[] | undefined;
  categoriaActivaId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (!categorias || categorias.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={categoriaActivaId === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(null)}
      >
        Todas
      </Button>
      {categorias.map((categoria) => (
        <Button
          key={categoria.id}
          variant={categoriaActivaId === categoria.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(categoria.id)}
        >
          {categoria.name}
        </Button>
      ))}
    </div>
  );
}
