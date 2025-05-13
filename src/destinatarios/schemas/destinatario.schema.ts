// src/destinatarios/schemas/destinatario.schema.ts
import { Schema, Document } from 'mongoose';

export interface Destinatario extends Document {
  readonly rut_usuario: string;
  readonly alias: string;
  readonly rut_destinatario: string;
  readonly cuenta_destino_id?: string;
  readonly fecha_agregado: Date;
}

// Esquema de Mongoose
export const DestinatarioSchema = new Schema({
  rut_usuario: { type: String, required: true },
  alias: { type: String, required: true },
  rut_destinatario: { type: String, required: true },
  cuenta_destino_id: { type: String, required: false },
  fecha_agregado: { type: Date, default: Date.now },  // Fecha automática
});
