// src/tarjeta/schemas/tarjeta.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// <<<< AÑADIR ESTA LÍNEA >>>>
export type TarjetaDocument = Tarjeta & Document;

@Schema({ timestamps: true })
export class Tarjeta extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Cuenta', required: true })
  cuenta_id: Types.ObjectId;

  @Prop({ required: true })
  numero: string;

  @Prop({ required: true })
  cvv: string;

  @Prop({ required: true })
  fecha_vencimiento: Date;

  @Prop({ default: 'activa', enum: ['activa', 'bloqueada'] })
  estado: string;

  @Prop({
    type: {
      monto_diario: { type: Number, default: 200000 },
      compras_sin_aprobacion: { type: Number, default: 5000 },
    },
  })
  limites: {
    monto_diario: number;
    compras_sin_aprobacion: number;
  };
}

export const TarjetaSchema = SchemaFactory.createForClass(Tarjeta);
