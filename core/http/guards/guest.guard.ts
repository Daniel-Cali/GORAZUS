import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';

/**
 * Parte 2.1 (infraestructura de `auth`, preparado — sin adoptar
 * todavía). Inverso de `JwtAuthGuard`: deja pasar solo si NO hay un
 * access token válido, para endpoints que no tendrían sentido con una
 * sesión ya activa (ej. "olvidé mi contraseña" cuando ya estás
 * logueado). Ningún controller lo usa todavía — todos los endpoints de
 * `auth` que podrían calzar (`login`, `forgot-password`) siguen
 * `@Public()` sin este guard, decisión de Parte 2 sin revisitar acá.
 *
 * No reutiliza `JwtStrategy`/Passport a propósito: `JwtAuthGuard` global
 * (`core/http/http.module.ts`) ya deja pasar de largo cualquier ruta
 * `@Public()` SIN correr la estrategia de Passport (retorna `true` antes
 * de intentar autenticar) — un guard que dependiera de que Passport ya
 * pobló `request.user` nunca detectaría un token válido en una ruta
 * `@Public()`. Este guard verifica el JWT por su cuenta, sin depender de
 * ese orden.
 */
@Injectable()
export class GuestGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) {
      return true;
    }

    try {
      jwt.verify(token, this.configService.getOrThrow<string>('auth.jwtAccessSecret'));
      return false; // token válido — ya hay sesión activa, no es "guest"
    } catch {
      return true; // token ausente/inválido/expirado — sí es "guest"
    }
  }
}
