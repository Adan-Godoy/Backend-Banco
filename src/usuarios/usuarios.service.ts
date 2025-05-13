import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario } from './schemas/usuario.schema';
import { CreateUsuarioDto } from './dto/create-usuario.dto';


@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
  ) {}

  async findByRut(rut: string): Promise<Usuario | null> {
    return this.usuarioModel.findOne({ rut }).exec();
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioModel.findOne({ email }).exec();
  }


  async create(data: CreateUsuarioDto): Promise<Usuario> {
    const nuevoUsuario = new this.usuarioModel(data);
    return nuevoUsuario.save();
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioModel.find().exec();
  }
}
