import { Schema } from 'mongoose';

export const DestinatarioSchema = new Schema({
  _id: String,
  rut_usuario: String,
  alias: String,
  rut_destinatario: String,
  cuenta_destino_id: String,
  fecha_agregado: Date,
});
