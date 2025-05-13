// src/destinatarios/destinatario.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Destinatario } from './schemas/destinatario.schema';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { Usuario } from 'src/usuarios/schemas/usuario.schema';
import { Cuenta } from 'src/cuentas/schemas/cuenta.schema';

@Injectable()
export class DestinatarioService {
  constructor(
    @InjectModel("Destinatario") private readonly destinatarioModel: Model<Destinatario>,
    @InjectModel("Usuario") private readonly usuarioModel: Model<Usuario>,
    @InjectModel(Cuenta.name) private readonly cuentaModel: Model<Cuenta>,
  ) {}

  // Crear un destinatario
  async create(createDestinatarioDto: CreateDestinatarioDto): Promise<Destinatario> {
    // Verificar existencia del usuario
    const usuario = await this.usuarioModel.findOne({ rut: createDestinatarioDto.rut_usuario });
    if (!usuario) {
      throw new NotFoundException('Usuario origen no encontrado');
    }

    // Verificar existencia del destinatario
    const destinatario = await this.usuarioModel.findOne({ rut: createDestinatarioDto.rut_destinatario });
    if (!destinatario) {
      throw new NotFoundException('Destinatario no encontrado');
    }

    // Verificar existencia de la cuenta de destino (si se proporciona)
    if (createDestinatarioDto.cuenta_destino_id) {
      const cuenta = await this.cuentaModel.findById(createDestinatarioDto.cuenta_destino_id);
      if (!cuenta) {
        throw new NotFoundException('Cuenta de destino no encontrada');
      }
    }

    // Crear y guardar el destinatario
    const newDestinatario = new this.destinatarioModel(createDestinatarioDto);
    return newDestinatario.save();
  }

  // Obtener destinatarios por rut_usuario
  async findByRutUsuario(rut_usuario: string): Promise<Destinatario[]> {
    return this.destinatarioModel.find({ rut_usuario }).exec();
  }

  // Obtener un destinatario por ID
  async findOne(id: string): Promise<Destinatario> {
    const destinatario = await this.destinatarioModel.findById(id).exec();
    if (!destinatario) {
      throw new NotFoundException('Destinatario no encontrado');
    }
    return destinatario;
  }

  // Eliminar un destinatario
  async remove(id: string): Promise<void> {
    const result = await this.destinatarioModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Destinatario no encontrado');
    }
  }
}
