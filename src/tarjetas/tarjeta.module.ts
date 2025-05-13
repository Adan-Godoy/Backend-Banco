import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tarjeta, TarjetaSchema } from './schemas/tarjeta.schema';
import { TarjetaService } from './tarjeta.service';
import { TarjetaController } from './tarjeta.controller';
import { UsuariosModule } from 'src/usuarios/usuarios.module';
import { Usuario, UsuarioSchema } from 'src/usuarios/schemas/usuario.schema'; // Importar el modelo de Usuario
import { Cuenta, CuentaSchema } from 'src/cuentas/schemas/cuenta.schema'; 

@Module({
  imports: [
    MongooseModule.forFeature([ 
      { name: Tarjeta.name, schema: TarjetaSchema },
      {name: 'Usuario', schema: UsuarioSchema },
      { name: Cuenta.name, schema: CuentaSchema },]),
    UsuariosModule
  ],
  providers: [TarjetaService],
  controllers: [TarjetaController],
  exports: [TarjetaService],
})
export class TarjetaModule {}
