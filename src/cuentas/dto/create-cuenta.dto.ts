import { Types } from 'mongoose';

export class CreateCuentaDto {
  readonly usuario_id: string | Types.ObjectId;
  readonly tipo: 'principal' | 'ahorro';
  readonly saldo?: number;
}
