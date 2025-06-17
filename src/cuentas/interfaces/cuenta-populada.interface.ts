// src/cuentas/interfaces/cuenta-populada.interface.ts

import { Types } from 'mongoose';
import { CuentaDocument } from '../schemas/cuenta.schema';

// Esta interfaz describe la estructura de una Cuenta
// cuando el campo 'usuario_id' ha sido populado.
export interface CuentaConUsuarioPopulado extends Omit<CuentaDocument, 'usuario_id'> {
  usuario_id: {
    _id: Types.ObjectId;
    rut: string;
  };
}