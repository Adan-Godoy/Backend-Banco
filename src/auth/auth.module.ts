// src/auth/auth.module.ts (modificado)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { FraudeModule } from '../fraude/fraude.module'; // << NUEVA LÍNEA
import { ConfigModule, ConfigService } from '@nestjs/config'; // << Importar
import { CuentasModule } from '../cuentas/cuentas.module'; // << Añadir import

@Module({
  imports: [
    UsuariosModule,
    CuentasModule,
    PassportModule,
    JwtModule.registerAsync({ // << Cambiar a registerAsync
      imports: [ConfigModule], // << Importar ConfigModule aquí también
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    FraudeModule, // << NUEVA LÍNEA: Importar el módulo de fraude
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}