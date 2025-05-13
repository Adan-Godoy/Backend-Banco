import { Schema } from 'mongoose';

export const CuentaSchema = new Schema({
  _id: String,
  usuario_id: String,
  tipo: { type: String, enum: ['principal', 'ahorro'] },
  saldo: Number,
  fecha_creacion: Date,
});
