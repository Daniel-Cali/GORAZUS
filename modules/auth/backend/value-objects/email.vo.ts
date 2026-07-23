import { DomainException } from '@gorazus/core-http';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailInvalidoException extends DomainException {
  constructor(valor: string) {
    super('EMAIL_INVALIDO', `Email inválido: ${valor}`, 400);
  }
}

/**
 * Value Object — Parte 2.1 (preparado, sin adoptar todavía). `Usuario`
 * (`entities/usuario.entity.ts`) sigue validando el email con su propia
 * regex inline + `throw new Error(...)` genérico (Parte 2 — Backend Core,
 * ya probado en `usuario.entity.spec.ts`) — no se tocó para no modificar
 * login/autenticación en esta parte. Este VO queda disponible para que
 * Parte 2.2 lo adopte, reemplazando esa validación ad hoc por una que
 * lanza `DomainException` (consistente con el resto del módulo) en vez de
 * `Error` genérico.
 *
 * Inmutable, igualdad por valor (`equals`), normaliza a minúsculas al
 * construir — mismo criterio que `uq_core_users_tenant_email ON
 * (tenant_id, lower(email))` (docs/database/sql/01_core.sql): dos emails
 * que difieren solo en mayúsculas ya son el mismo usuario a nivel de
 * base de datos, el VO refleja esa misma regla en el dominio.
 */
export class Email {
  private readonly valor: string;

  constructor(valor: string) {
    if (!EMAIL_PATTERN.test(valor)) {
      throw new EmailInvalidoException(valor);
    }
    this.valor = valor.toLowerCase();
  }

  toString(): string {
    return this.valor;
  }

  equals(otro: Email): boolean {
    return this.valor === otro.valor;
  }
}
