// src/app.module.ts (VERSIÓN FINAL Y LIMPIA)

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
import { TransaccionesModule } from './transacciones/transacciones.module'; // Importante
import { Neo4jModule } from './neo4j/neo4j.module';
import { FraudeModule } from './fraude/fraude.module';

// <<<< ELIMINA LAS IMPORTACIONES DE SCHEMAS INDIVIDUALES >>>>
// import { TransaccionSchema } from './transacciones/schemas/transaccion.schema';
// import { DestinatarioSchema } from './destinatarios/schemas/destinatario.schema';


@Module({
  imports: [
    // 1. Cargar Configuración
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configurar Conexión a Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    // 3. Importar todos los Módulos de la Aplicación
    // Cada módulo es responsable de sus propios schemas y dependencias.
    UsuariosModule,
    AuthModule,
    CuentasModule,
    TarjetaModule,
    DestinatarioModule,
    TransaccionesModule, // El AppModule solo necesita saber que este módulo existe
    Neo4jModule,
    FraudeModule,

    // <<<< ELIMINA ESTA SECCIÓN POR COMPLETO >>>>
    /*
    MongooseModule.forFeature([
      { name: 'Transaccion', schema: TransaccionSchema },
      { name: 'Destinatario', schema: DestinatarioSchema },
    ]),
    */
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}