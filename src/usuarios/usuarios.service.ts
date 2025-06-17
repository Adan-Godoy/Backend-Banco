// src/usuarios/usuarios.service.ts (VERSIÓN CORREGIDA Y ESTANDARIZADA)

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel("Usuario") // Usar Usuario.name es la mejor práctica
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  // << ASEGURAR TIPO DE RETORNO >>
  async findByRut(rut: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({ rut }).exec();
  }

  // << ASEGURAR TIPO DE RETORNO >>
  async findByEmail(email: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({ email }).exec();
  }

  // << ASEGURAR TIPO DE RETORNO >>
  async create(data: CreateUsuarioDto): Promise<UsuarioDocument> {
    const nuevoUsuario = new this.usuarioModel(data);
    return nuevoUsuario.save();
  }

  // << ASEGURAR TIPO DE RETORNO >>
  async findAll(): Promise<UsuarioDocument[]> {
    return this.usuarioModel.find().exec();
  }

  async updatePassword(id: string, newHashedPassword: string): Promise<void> {
    await this.usuarioModel.updateOne({ _id: id }, { password: newHashedPassword }).exec();
  }

  // << TIPO DE RETORNO YA ES CORRECTO >>
  async findById(id: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findById(id).exec();
  }
}