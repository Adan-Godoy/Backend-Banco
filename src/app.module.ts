import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuarioSchema } from './usuarios/schemas/usuario.schema';
import { TransaccionSchema } from './schemas/transaccion.schema';
import { DestinatarioSchema } from './schemas/destinatario.schema';
import { UsuariosService } from './usuarios/usuarios.service';
import { UsuariosController } from './usuarios/usuarios.controller';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';  // Importa AuthModule
import { CuentasModule } from './cuentas/cuentas.module';
import { TarjetaModule } from './tarjetas/tarjeta.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://adangodoy:7Cnu5x3hHmjDfoQ8@banco.3zn6kge.mongodb.net/'),
    MongooseModule.forFeature([
      { name: 'Transaccion', schema: TransaccionSchema },
      { name: 'Destinatario', schema: DestinatarioSchema },
      
    ]),
    UsuariosModule,
    AuthModule,
    CuentasModule,
    TarjetaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
