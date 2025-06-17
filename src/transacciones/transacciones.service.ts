// src/transacciones/transacciones.service.ts

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Transaccion, TransaccionDocument } from './schemas/transaccion.schema';
import { CuentasService } from '../cuentas/cuentas.service';
import { TarjetaService } from '../tarjetas/tarjeta.service';
import { FraudeService } from '../fraude/fraude.service';
import { CrearTransferenciaDto } from './dto/crear-transferencia.dto';
import { CrearCompraDto } from './dto/crear-compra.dto';
import { CuentaConUsuarioPopulado } from '../cuentas/interfaces/cuenta-populada.interface';


@Injectable()
export class TransaccionesService {
  constructor(
    @InjectModel(Transaccion.name) private readonly transaccionModel: Model<TransaccionDocument>,
    private readonly cuentasService: CuentasService,
    private readonly tarjetaService: TarjetaService,
    private readonly fraudeService: FraudeService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async realizarTransferencia(dto: CrearTransferenciaDto, usuarioId: string) {
    const { monto, numero_cuenta_destino } = dto;
    if (monto <= 0) throw new BadRequestException('El monto debe ser positivo.');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const [cuentaOrigen, cuentaDestino] = await Promise.all([
        this.cuentasService.findCuentaPrincipalByUsuarioId(usuarioId),
        this.cuentasService.findCuentaByNumero(numero_cuenta_destino),
      ]);

      if (!cuentaOrigen) throw new NotFoundException('Cuenta de origen no encontrada.');
      if (!cuentaDestino) throw new NotFoundException('Cuenta de destino no encontrada.');
      if (cuentaOrigen.id === cuentaDestino.id) throw new BadRequestException('No se puede transferir a la misma cuenta.');
      if (cuentaOrigen.saldo < monto) throw new BadRequestException('Fondos insuficientes.');

      await this.cuentasService.debitar(cuentaOrigen.id, monto, session);
      await this.cuentasService.acreditar(cuentaDestino.id, monto, session);
      
      const datosTransaccion = {
        usuario_origen_id: usuarioId,
        cuenta_origen_id: cuentaOrigen.id,
        usuario_destino_id: cuentaDestino.usuario_id._id,
        cuenta_destino_id: cuentaDestino.id,
        tipo: 'transferencia' as const,
        monto,
      };

      const documentosCreados = await this.transaccionModel.create([datosTransaccion], { session });
      const transaccionGuardada = documentosCreados[0];
      
      // --- INICIO DE LA SOLUCIÓN FINALÍSIMA ---
      // Dado que TypeScript se niega a reconocer el tipo, usamos `as any` para
      // desactivar la revisión de tipos en este punto específico y acceder a la propiedad.
      // Sabemos que en tiempo de ejecución, `_id` existirá y tendrá un método `.toString()`.
      const transaccionId = (transaccionGuardada as any)._id.toString();
      // --- FIN DE LA SOLUCIÓN FINALÍSIMA ---

      await session.commitTransaction();

      const rutOrigen = cuentaOrigen.usuario_id.rut;
      const rutDestino = cuentaDestino.usuario_id.rut;
      
      // La variable `transaccionId` ahora es una `string`, por lo que esta asignación será válida.
      this.fraudeService.registrarTransferenciaEnGrafo({
        rutOrigen,
        rutDestino,
        monto: dto.monto,
        numeroCuentaOrigen: cuentaOrigen.numero_cuenta,
        numeroCuentaDestino: cuentaDestino.numero_cuenta,
        transaccionId,
      });
      
      return { message: 'Transferencia realizada con éxito.' };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  async realizarCompra(dto: CrearCompraDto, usuarioId: string) {
    const { monto, numero_tarjeta, cvv_tarjeta, fecha_vencimiento_tarjeta, nombre_comercio } = dto;
    if (monto <= 0) throw new BadRequestException('El monto debe ser positivo.');

    // 1. Validar la tarjeta (necesitarás un método 'validarYObtenerTarjeta' en TarjetaService)
    const tarjeta = await this.tarjetaService.validarYObtenerTarjeta({
      numero: numero_tarjeta,
      cvv: cvv_tarjeta,
      fecha_vencimiento: fecha_vencimiento_tarjeta,
    });
    
    // Verificar que la tarjeta pertenece al usuario autenticado
    if (tarjeta.usuario_id.toString() !== usuarioId) {
      throw new ForbiddenException('La tarjeta no pertenece a este usuario.');
    }
    
    // 2. Llamar al motor de fraude
    const analisis = await this.fraudeService.analizarTransaccion({
      monto,
      limiteSinAprobacion: tarjeta.limites.compras_sin_aprobacion,
    });
    
    // 3. Crear la transacción en la base de datos con el estado correspondiente
    const transaccionData = {
      usuario_origen_id: usuarioId,
      cuenta_origen_id: tarjeta.cuenta_id,
      tarjeta_id: tarjeta._id,
      tipo: 'compra' as const,
      monto,
      nombre_comercio,
      estado: 'pendiente', // Por defecto
      detalles_fraude: {
        sospechosa: analisis.veredicto !== 'aprobar',
        motivo: analisis.motivo,
        analizado_por: 'AUTOMATICO'
      }
    };

    // --- LÓGICA DE APLICACIÓN ---
    switch (analisis.veredicto) {
      case 'aprobar':
        // Si se aprueba, procesamos el débito inmediatamente y cambiamos el estado.
        transaccionData.estado = 'completada';
        const transaccionAprobada = new this.transaccionModel(transaccionData);
        await this.procesarDebitoCompra(tarjeta.cuenta_id, monto); // Método de débito simple
        await transaccionAprobada.save();
        // TODO: Registrar en Neo4j, notificar
        return { message: 'Compra aprobada y realizada con éxito.', transaccion: transaccionAprobada };

      case 'requiere_aprobacion':
        // Si requiere aprobación, solo guardamos la transacción como 'pendiente'.
        transaccionData.estado = 'pendiente';
        const transaccionPendiente = new this.transaccionModel(transaccionData);
        await transaccionPendiente.save();
        // TODO: Notificar al usuario para que apruebe/rechace
        return { 
            message: 'Esta compra requiere tu aprobación.', 
            transaccionId: transaccionPendiente._id,
            motivo: analisis.motivo
        };

      case 'bloquear':
        // Si se bloquea, la guardamos como 'bloqueada' y no hacemos nada más.
        transaccionData.estado = 'bloqueada';
        const transaccionBloqueada = new this.transaccionModel(transaccionData);
        await transaccionBloqueada.save();
        // TODO: Notificar al usuario sobre el bloqueo
        throw new ForbiddenException(analisis.motivo);
    }
  }

  // ---- MÉTODO PARA OBTENER HISTORIAL ----
  async getHistorial(usuarioId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    // Buscar todas las cuentas del usuario
    const cuentas = await this.cuentasService.findByUsuario(usuarioId);
    const cuentaIds = cuentas.map(c => c._id);
    
    // Buscar todas las transacciones donde el usuario es origen O destino
    const transacciones = await this.transaccionModel.find({
      $or: [
        { cuenta_origen_id: { $in: cuentaIds } },
        { cuenta_destino_id: { $in: cuentaIds } }
      ]
    })
    .sort({ createdAt: -1 }) // Más recientes primero
    .skip(skip)
    .limit(limit)
    .exec();
    
    return transacciones;
  }

  // Método auxiliar para el débito de una compra (sin sesión de transacción)
  private async procesarDebitoCompra(cuentaId: Types.ObjectId, monto: number) {
    const cuenta = await this.cuentasService.findCuentaById(cuentaId); // Necesitarás este método

    if (!cuenta) {
      // Este error no debería ocurrir en un flujo normal, pero es una protección vital.
      throw new NotFoundException(`La cuenta con ID ${cuentaId} no fue encontrada para el débito.`);
    }

    if (cuenta.saldo < monto) {
      throw new BadRequestException('Fondos insuficientes para completar la compra.');
    }
    await this.cuentasService.debitarSinSesion(cuentaId, monto); // Y este
  }

  async gestionarAprobacion(transaccionId: string, usuarioId: string, accion: 'aprobar' | 'rechazar') {
    const transaccion = await this.transaccionModel.findOne({
      _id: transaccionId,
      usuario_origen_id: usuarioId,
      estado: 'pendiente'
    });

    if (!transaccion) {
      throw new NotFoundException('Transacción pendiente no encontrada o no te pertenece.');
    }

    if (accion === 'aprobar') {
      // Intentar procesar el débito. Si falla, lanzará una excepción.
      await this.procesarDebitoCompra(transaccion.cuenta_origen_id, transaccion.monto);
      transaccion.estado = 'completada';
      await transaccion.save();
      return { message: 'Transacción aprobada y completada.' };
    } else { // accion === 'rechazar'
      transaccion.estado = 'rechazada';
      await transaccion.save();
      return { message: 'Transacción rechazada.' };
    }
  }
}