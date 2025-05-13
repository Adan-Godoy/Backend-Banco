import { Document } from 'mongoose';

export interface Cuenta extends Document {
  usuario_id: string;
  tipo: 'principal' | 'ahorro';
  saldo: number;
}
