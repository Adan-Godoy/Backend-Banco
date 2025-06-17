// src/cuentas/cuentas.service.ts

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import { Cuenta, CuentaDocument } from './schemas/cuenta.schema';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { TransferenciaInternaDto } from './dto/transferencia-interna.dto';
import { FraudeService } from '../fraude/fraude.service'; 
import { CuentaConUsuarioPopulado } from './interfaces/cuenta-populada.interface';

@Injectable()
export class CuentasService {
  private readonly logger = new Logger(CuentasService.name);

  constructor(
    @InjectModel(Cuenta.name) private readonly cuentaModel: Model<CuentaDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly fraudeService: FraudeService,
  ) {}

  // ... (otros métodos que ya funcionaban)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'generar_intereses' })
  async handleGenerarIntereses() {
    this.logger.log('Iniciando tarea programada: Generar Intereses...');
    const tasaInteres = 0.001;
    const resultado = await this.cuentaModel.updateMany(
      { tipo: 'ahorro', saldo: { $gt: 0 } },
      [ { $set: { saldo: { $round: [ { $multiply: ['$saldo', 1 + tasaInteres] }, 2 ] } } } ]
    );
    this.logger.log(`Tarea completada. Cuentas de ahorro actualizadas: ${resultado.modifiedCount}`);
  }

  async crearCuentasParaNuevoUsuario(usuarioId: Types.ObjectId, rutUsuario: string): Promise<void> {
    const cuentaPrincipalData: CreateCuentaDto = {
      usuario_id: usuarioId,
      tipo: 'principal',
      rut_usuario: rutUsuario,
    };
    const cuentaAhorroData: CreateCuentaDto = {
      usuario_id: usuarioId,
      tipo: 'ahorro',
      rut_usuario: rutUsuario,
    };
    await this.create(cuentaPrincipalData);
    await this.create(cuentaAhorroData);
  }

  async create(data: CreateCuentaDto): Promise<CuentaDocument> {
    const rutSinPuntosGuion = data.rut_usuario.replace(/[.-]/g, '');
    const sufijo = data.tipo === 'principal' ? '0' : '1';
    const numero_cuenta = `${rutSinPuntosGuion}-${sufijo}`;
    const datosCompletos = {
      usuario_id: data.usuario_id,
      tipo: data.tipo,
      saldo: data.saldo || 0,
      numero_cuenta,
    };
    const nuevaCuenta = new this.cuentaModel(datosCompletos);
    const cuentaGuardada = await nuevaCuenta.save();
    this.fraudeService.crearNodoCuenta({
      usuarioRut: data.rut_usuario,
      numeroCuenta: cuentaGuardada.numero_cuenta,
      tipoCuenta: cuentaGuardada.tipo,
    });
    return cuentaGuardada;
  }

  async findByUsuario(usuario_id: string): Promise<CuentaDocument[]> {
    const usuarioObjectId = new Types.ObjectId(usuario_id);
    return this.cuentaModel.find({ usuario_id: usuarioObjectId }).exec();
  }

  async getSaldoYMovimientos(usuario_id: string): Promise<CuentaDocument[]> {
    const usuarioObjectId = new Types.ObjectId(usuario_id);
    return this.cuentaModel
      .find({ usuario_id: usuarioObjectId })
      .select('tipo saldo')
      .exec();
  }

  async transferirEntreCuentasPropias(usuarioId: string, dto: TransferenciaInternaDto): Promise<{ message: string }> {
    const { monto, cuentaOrigenId, cuentaDestinoId } = dto;
    if (monto <= 0) {
      throw new BadRequestException('El monto debe ser positivo.');
    }
    const usuarioObjectId = new Types.ObjectId(usuarioId);
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const cuentaOrigen = await this.cuentaModel.findOneAndUpdate(
        { _id: cuentaOrigenId, usuario_id: usuarioObjectId, saldo: { $gte: monto } },
        { $inc: { saldo: -monto } },
        { session, new: true }
      );
      if (!cuentaOrigen) {
        throw new BadRequestException('Fondos insuficientes o la cuenta de origen no pertenece al usuario.');
      }
      const cuentaDestino = await this.cuentaModel.findOneAndUpdate(
        { _id: cuentaDestinoId, usuario_id: usuarioObjectId },
        { $inc: { saldo: monto } },
        { session, new: true }
      );
      if (!cuentaDestino) {
        throw new NotFoundException('La cuenta de destino no pertenece al usuario.');
      }
      await session.commitTransaction();
      return { message: 'Transferencia interna realizada con éxito.' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Fallo la transferencia interna, realizando rollback:', error.stack);
      throw new BadRequestException(error.message || 'No se pudo completar la transferencia.');
    } finally {
      session.endSession();
    }
  }

  async findCuentaPrincipalByUsuarioId(usuarioId: string | Types.ObjectId): Promise<CuentaConUsuarioPopulado | null> {
    const usuarioObjectId = typeof usuarioId === 'string' 
      ? new Types.ObjectId(usuarioId) 
      : usuarioId;
    
    // CORRECCIÓN: Le decimos a Mongoose que seleccione '_id' y 'rut'.
    // Y le indicamos a TypeScript la forma exacta del objeto populado.
    return this.cuentaModel
      .findOne({ usuario_id: usuarioObjectId, tipo: 'principal' })
      .populate<{ usuario_id: { _id: Types.ObjectId; rut: string } }>('usuario_id', '_id rut')
      .exec();
  }

  async findCuentaByNumero(numeroCuenta: string): Promise<CuentaConUsuarioPopulado | null> {
    // CORRECCIÓN: Aplicamos la misma lógica aquí.
    return this.cuentaModel
      .findOne({ numero_cuenta: numeroCuenta })
      .populate<{ usuario_id: { _id: Types.ObjectId; rut: string } }>('usuario_id', '_id rut')
      .exec();
  }

  // ... (resto de los métodos auxiliares sin cambios)
  async debitar(cuentaId: string | Types.ObjectId, monto: number, session: ClientSession): Promise<void> {
    const resultado = await this.cuentaModel.updateOne(
      { _id: cuentaId, saldo: { $gte: monto } },
      { $inc: { saldo: -monto } },
      { session }
    );
    if (resultado.modifiedCount === 0) {
      throw new BadRequestException('Fondos insuficientes.');
    }
  }

  async acreditar(cuentaId: string | Types.ObjectId, monto: number, session: ClientSession): Promise<void> {
    await this.cuentaModel.updateOne(
      { _id: cuentaId },
      { $inc: { saldo: monto } },
      { session }
    );
  }

  async findCuentaById(cuentaId: string | Types.ObjectId): Promise<CuentaDocument | null> {
    return this.cuentaModel.findById(cuentaId).exec();
  }
  
  async debitarSinSesion(cuentaId: string | Types.ObjectId, monto: number): Promise<void> {
    const resultado = await this.cuentaModel.updateOne(
      { _id: cuentaId, saldo: { $gte: monto } },
      { $inc: { saldo: -monto } }
    );
    if (resultado.modifiedCount === 0) {
      throw new BadRequestException('Fondos insuficientes al momento de procesar el débito.');
    }
  }
}