import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cuenta } from './schemas/cuenta.schema';
import { CreateCuentaDto } from './dto/create-cuenta.dto';

@Injectable()
export class CuentasService {
  constructor(
    @InjectModel(Cuenta.name) private readonly cuentaModel: Model<Cuenta>,
  ) {}

  async create(data: CreateCuentaDto): Promise<Cuenta> {
    return new this.cuentaModel(data).save();
  }

  async findByUsuario(usuario_id: string): Promise<Cuenta[]> {
    return this.cuentaModel.find({ usuario_id }).exec();
  }

  async getSaldoYMovimientos(usuario_id: string) {
    return this.cuentaModel
      .find({ usuario_id })
      .select('tipo saldo')
      .exec();
  }
}
