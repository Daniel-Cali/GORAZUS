import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';

/**
 * `@CurrentUser() user: UserContext` en un controller — lee lo que
 * `JwtAuthGuard`/`JwtStrategy` ya dejaron en `request.user` (Passport
 * lo puebla ahí por convención). Nunca vuelve a decodificar el JWT.
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest<{ user: UserContext }>();
    return request.user;
  },
);
