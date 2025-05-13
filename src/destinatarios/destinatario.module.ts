// src/destinatarios/destinatario.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DestinatarioController } from './destinatario.controller';
import { DestinatarioService } from './destinatario.service';
import { Destinatario, DestinatarioSchema } from './schemas/destinatario.schema';
import { UsuarioSchema } from 'src/usuarios/schemas/usuario.schema';
import { UsuariosModule } from 'src/usuarios/usuarios.module';
import { CuentasModule } from 'src/cuentas/cuentas.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Destinatario" , schema: DestinatarioSchema },
        { name: 'Usuario', schema: UsuarioSchema },
    ]),
    UsuariosModule,
    CuentasModule,
  ],
  controllers: [DestinatarioController],
  providers: [DestinatarioService],
})
export class DestinatarioModule {}
