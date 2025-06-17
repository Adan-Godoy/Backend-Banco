// src/app.module.ts (MODIFICADO Y REORDENADO)

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos de tu aplicación
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { CuentasModule } from './cuentas/cuentas.module';
import { TarjetaModule } from './tarjetas/tarjeta.module';
import { DestinatarioModule } from './destinatarios/destinatario.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { FraudeModule } from './fraude/fraude.module';

// Schemas que no pertenecen a un módulo específico (si los tienes)
import { TransaccionSchema } from './schemas/transaccion.schema';
import { DestinatarioSchema } from './destinatarios/schemas/destinatario.schema';



@Module({
  imports: [
    // 1. Cargar Configuración primero y de forma global
    ConfigModule.forRoot({
      isGlobal: true, // Esto es clave
    }),

    // 2. Configurar Mongoose de forma asíncrona para usar ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    // 3. Módulos que registran sus propios schemas
    UsuariosModule,
    AuthModule,
    CuentasModule,
    TarjetaModule,
    DestinatarioModule,
    Neo4jModule,
    FraudeModule,

    // 4. Registrar schemas "globales" si es necesario.
    // NOTA: Es mejor práctica que cada schema viva dentro de su propio módulo.
    // Por ejemplo, TransaccionSchema debería estar en un TransaccionesModule.
    // Pero si los quieres aquí, esta es la forma.
    MongooseModule.forFeature([
      { name: 'Transaccion', schema: TransaccionSchema },
      // El schema de Destinatario ya debería estar en DestinatarioModule, esto puede ser redundante.
      { name: 'Destinatario', schema: DestinatarioSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}