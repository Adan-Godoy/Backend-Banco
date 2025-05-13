import { Document } from 'mongoose';

export interface Usuario extends Document {
  readonly rut: string;
  readonly nombre: string;
  readonly email: string;
  readonly password: string;
}
