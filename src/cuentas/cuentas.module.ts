import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cuenta, CuentaSchema } from './schemas/cuenta.schema';
import { CuentasService } from './cuentas.service';
import { CuentasController } from './cuentas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cuenta.name, schema: CuentaSchema }]),
  ],
  providers: [CuentasService],
  controllers: [CuentasController],
  exports: [CuentasService, MongooseModule],
})
export class CuentasModule {}
