// src/usuarios/schemas/usuario.schema.ts

import { Schema, Document, Types } from 'mongoose';

// Interfaz
export interface Usuario extends Document {
  readonly rut: string;
  readonly nombre: string;
  readonly email: string;
  readonly password: string;
}

// Tipo adicional para usar con Mongoose
export type UsuarioDocument = Document & {
  _id: Types.ObjectId;
  rut: string;
  nombre: string;
  email: string;
  password: string;
};

// Esquema de Mongoose
export const UsuarioSchema = new Schema({
  rut: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
