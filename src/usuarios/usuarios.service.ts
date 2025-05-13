import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { CuentasService } from '../cuentas/cuentas.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel('Usuario')
    private readonly usuarioModel: Model<UsuarioDocument>,

    private readonly cuentasService: CuentasService,
  ) {}

  async findByRut(rut: string): Promise<Usuario | null> {
    return this.usuarioModel.findOne({ rut }).exec();
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioModel.findOne({ email }).exec();
  }

  async create(data: CreateUsuarioDto): Promise<Usuario> {
    const nuevoUsuario = new this.usuarioModel(data);
    const usuario = await nuevoUsuario.save();

    await this.cuentasService.create({
      usuario_id: usuario._id.toString(),
      tipo: 'principal',
    });

    await this.cuentasService.create({
      usuario_id: usuario._id.toString(),
      tipo: 'ahorro',
    });

    return usuario;
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioModel.find().exec();
  }
}
