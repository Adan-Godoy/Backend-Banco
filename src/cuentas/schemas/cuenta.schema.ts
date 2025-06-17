// src/cuentas/schemas/cuenta.schema.ts (CORREGIDO)

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// <<<<<<< PASO 1: AÑADIR ESTA LÍNEA >>>>>>>>>
// Esta línea crea y exporta el tipo que representa a un documento 'Cuenta'
// con todas las propiedades de Mongoose.
export type CuentaDocument = Cuenta & Document;

@Schema({ timestamps: true })
export class Cuenta extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario_id: Types.ObjectId;

  @Prop({ required: true, enum: ['principal', 'ahorro'] })
  tipo: 'principal' | 'ahorro';

  @Prop({ default: 0 })
  saldo: number;
}

export const CuentaSchema = SchemaFactory.createForClass(Cuenta);