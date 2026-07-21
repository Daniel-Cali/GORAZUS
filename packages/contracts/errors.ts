/**
 * Formato de error estable de toda la API — ya fijado en
 * docs/architecture/07-convenciones-y-estandares.md §4 (inspirado en
 * RFC 7807). `code` es contrato estable (el frontend puede ramificar
 * lógica sobre él); `message` es para mostrar al usuario, puede
 * cambiar de redacción sin ser breaking change. Consumido por
 * core/http/filters/exception.filter.ts al serializar cualquier
 * DomainException/ValidationException hacia el cliente.
 */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[];
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/** Envoltorio de éxito con paginación — mismo contrato de `07-convenciones-y-estandares.md §4`. */
export interface ApiSuccessBody<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
