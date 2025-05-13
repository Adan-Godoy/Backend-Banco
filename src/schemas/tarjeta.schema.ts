import { Schema } from 'mongoose';

export const TarjetaSchema = new Schema({
  _id: String,
  usuario_id: String,
  cuenta_id: String,
  numero: String,
  estado: { type: String, enum: ['activa', 'bloqueada', 'inactiva'] },
  limites: Schema.Types.Mixed,
});
