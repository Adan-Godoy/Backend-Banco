// src/auth/jwt.strategy.ts (CORREGIDO)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    // Validación explícita
    if (!secret) {
      throw new Error('JWT_SECRET no está definido en el archivo .env. La aplicación no puede iniciarse de forma segura.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // << Ahora TypeScript sabe que 'secret' es un string
    });
  }

  async validate(payload: any) {
    // ---- LOG DE DEPURACIÓN #1 ----
    console.log('[DEBUG] Payload del JWT validado:', payload);
    
    const userObject = { userId: payload.sub, rut: payload.rut };
    
    // ---- LOG DE DEPURACIÓN #2 ----
    console.log('[DEBUG] Objeto devuelto por validate():', userObject);

    return userObject;
  }
}