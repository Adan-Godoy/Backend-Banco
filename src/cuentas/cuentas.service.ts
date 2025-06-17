import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Cuenta, CuentaDocument } from './schemas/cuenta.schema'; // Importa también CuentaDocument
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { TransferenciaInternaDto } from './dto/transferencia-interna.dto';

@Injectable()
export class CuentasService {
  private readonly logger = new Logger(CuentasService.name);

  constructor(
    @InjectModel(Cuenta.name) private readonly cuentaModel: Model<CuentaDocument>, // Usar CuentaDocument para mejor tipado
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'generar_intereses' })
  async handleGenerarIntereses() {
    this.logger.log('Iniciando tarea programada: Generar Intereses...');
    
    const tasaInteres = 0.001; // 0.1% de interés diario (ejemplo)

    const resultado = await this.cuentaModel.updateMany(
      { tipo: 'ahorro', saldo: { $gt: 0 } },
      [ { $set: { saldo: { $round: [ { $multiply: ['$saldo', 1 + tasaInteres] }, 2 ] } } } ]
    );
    
    this.logger.log(`Tarea completada. Cuentas de ahorro actualizadas: ${resultado.modifiedCount}`);
  }

  async crearCuentasParaNuevoUsuario(usuarioId: string | Types.ObjectId): Promise<void> {
    const cuentaPrincipalData: CreateCuentaDto = {
      usuario_id: usuarioId, // Se pasa el ObjectId directamente, esto está bien
      tipo: 'principal',
      saldo: 0,
    };

    const cuentaAhorroData: CreateCuentaDto = {
      usuario_id: usuarioId,
      tipo: 'ahorro',
      saldo: 0,
    };

    await this.create(cuentaPrincipalData);
    await this.create(cuentaAhorroData);
  }

  async create(data: CreateCuentaDto): Promise<CuentaDocument> {
    const nuevaCuenta = new this.cuentaModel(data);
    return nuevaCuenta.save();
  }

  async findByUsuario(usuario_id: string): Promise<CuentaDocument[]> {
    this.logger.log(`[DEBUG] Buscando cuentas para usuario_id (string): ${usuario_id}`);
    
    // **CORRECCIÓN #1: Convertir explícitamente a ObjectId**
    const usuarioObjectId = new Types.ObjectId(usuario_id);
    this.logger.log(`[DEBUG] Buscando con ObjectId: ${usuarioObjectId}`);
    
    return this.cuentaModel.find({ usuario_id: usuarioObjectId }).exec();
  }

  async getSaldoYMovimientos(usuario_id: string): Promise<CuentaDocument[]> {
    this.logger.log(`[DEBUG] Obteniendo saldo y movimientos para usuario_id (string): ${usuario_id}`);
    
    // **CORRECCIÓN #2: Convertir explícitamente a ObjectId aquí también**
    const usuarioObjectId = new Types.ObjectId(usuario_id);
    this.logger.log(`[DEBUG] Buscando con ObjectId: ${usuarioObjectId}`);

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

    // **CORRECCIÓN #3: Convertir explícitamente a ObjectId para las transacciones**
    const usuarioObjectId = new Types.ObjectId(usuarioId);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      this.logger.log(`[TRANSACCIÓN] Intentando debitar ${monto} de la cuenta ${cuentaOrigenId} para el usuario ${usuarioObjectId}`);
      
      const cuentaOrigen = await this.cuentaModel.findOneAndUpdate(
        // Usar el ObjectId en la consulta
        { _id: cuentaOrigenId, usuario_id: usuarioObjectId, saldo: { $gte: monto } },
        { $inc: { saldo: -monto } },
        { session, new: true }
      );

      if (!cuentaOrigen) {
        throw new BadRequestException('Fondos insuficientes o la cuenta de origen no pertenece al usuario.');
      }
      
      this.logger.log(`[TRANSACCIÓN] Débito exitoso. Acreditando a la cuenta ${cuentaDestinoId}`);

      const cuentaDestino = await this.cuentaModel.findOneAndUpdate(
        // Usar el ObjectId en la consulta
        { _id: cuentaDestinoId, usuario_id: usuarioObjectId },
        { $inc: { saldo: monto } },
        { session, new: true }
      );

      if (!cuentaDestino) {
        // Esto solo ocurriría si la cuenta de destino no existe o no pertenece al usuario
        throw new NotFoundException('La cuenta de destino no pertenece al usuario.');
      }

      await session.commitTransaction();
      this.logger.log(`[TRANSACCIÓN] Commit exitoso.`);
      return { message: 'Transferencia interna realizada con éxito.' };

    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Fallo la transferencia interna, realizando rollback:', error.stack);
      // Re-lanzar el error para que el cliente reciba la respuesta adecuada
      throw new BadRequestException(error.message || 'No se pudo completar la transferencia.');
    } finally {
      session.endSession();
    }
  }
}