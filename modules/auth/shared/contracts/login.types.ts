export type { LoginInput } from './login.schema';

/**
 * Respuesta real de `POST /auth/login` (`modules/auth/backend/controllers/auth.controller.ts`).
 * `activeCompanyId`/`activeBranchId` son `null` en "modo todas las empresas"
 * (usuario sin empresa/sucursal fija, `core.users.company_id`/`branch_id`
 * nullable) — mismo tipo que `AppStore.activeCompanyId` en `ui-kit/store/app.store.ts`,
 * nunca forzado a string vacío.
 */
export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  activeCompanyId: string | null;
  activeBranchId: string | null;
}
