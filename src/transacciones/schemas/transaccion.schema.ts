// src/transacciones/schemas/transaccion.schema.ts (o donde lo tengas)

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class DetallesFraude {
  @Prop()
  sospechosa: boolean;

  @Prop()
  motivo: string;

  @Prop()
  analizado_por: string; // Podría ser 'AUTOMATICO' o el ID de un admin
}

export type TransaccionDocument = Transaccion & Document;

@Schema({ timestamps: true })
export class Transaccion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario_origen_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Cuenta', required: true })
  cuenta_origen_id: Types.ObjectId;

  // Para transferencias
  @Prop({ type: Types.ObjectId, ref: 'Usuario' })
  usuario_destino_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Cuenta' })
  cuenta_destino_id?: Types.ObjectId;
  
  // Para compras
  @Prop({ type: Types.ObjectId, ref: 'Tarjeta' })
  tarjeta_id?: Types.ObjectId;
  
  @Prop({ type: String })
  nombre_comercio?: string;

  @Prop({ required: true, enum: ['transferencia', 'compra', 'retiro', 'deposito'] })
  tipo: string;

  @Prop({ required: true })
  monto: number;

  @Prop({ required: true, default: 'completada', enum: ['completada', 'pendiente', 'rechazada', 'bloqueada'] })
  estado: string;

  @Prop({ type: DetallesFraude, _id: false, required: false })
  detalles_fraude?: DetallesFraude;
}

export const TransaccionSchema = SchemaFactory.createForClass(Transaccion);
