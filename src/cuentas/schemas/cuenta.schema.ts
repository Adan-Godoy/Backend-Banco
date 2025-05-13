import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
