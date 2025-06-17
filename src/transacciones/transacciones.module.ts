// src/transacciones/transacciones.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaccion, TransaccionSchema } from './schemas/transaccion.schema';
import { TransaccionesService } from './transacciones.service';
import { TransaccionesController } from './transacciones.controller';
import { CuentasModule } from '../cuentas/cuentas.module';
import { TarjetaModule } from '../tarjetas/tarjeta.module';
import { FraudeModule } from '../fraude/fraude.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaccion.name, schema: TransaccionSchema }]),
    CuentasModule,
    TarjetaModule,
    FraudeModule,
  ],
  providers: [TransaccionesService],
  controllers: [TransaccionesController],
})
export class TransaccionesModule {}