import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tarjeta } from './schemas/tarjeta.schema';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { Usuario } from 'src/usuarios/schemas/usuario.schema';
import { Cuenta } from 'src/cuentas/schemas/cuenta.schema';

@Injectable()
export class TarjetaService {
  constructor(
  @InjectModel(Tarjeta.name) private readonly tarjetaModel: Model<Tarjeta>,
  @InjectModel('Usuario') private readonly usuarioModel: Model<Usuario>,
  @InjectModel(Cuenta.name) private readonly cuentaModel: Model<Cuenta>,
) {}

  async create(data: CreateTarjetaDto): Promise<Tarjeta> {
  // Verificar existencia del usuario
  const usuario = await this.usuarioModel.findById(data.usuario_id);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar existencia de la cuenta y que pertenezca al usuario
  const cuenta = await this.cuentaModel.findById(data.cuenta_id);
  if (!cuenta || cuenta.usuario_id.toString() !== data.usuario_id) {
    throw new Error('Cuenta inválida o no pertenece al usuario');
  }

  // Crear tarjeta
  return new this.tarjetaModel(data).save();
}

  async findByUsuario(usuario_id: string): Promise<Tarjeta[]> {
    return this.tarjetaModel.find({ usuario_id }).exec();
  }
}
