// src/cuentas/dto/create-cuenta.dto.ts (MODIFICADO)
import { Types } from 'mongoose';

export class CreateCuentaDto {
  readonly usuario_id: string | Types.ObjectId;
  readonly tipo: 'principal' | 'ahorro';
  readonly rut_usuario: string; // << Añadimos el RUT
  readonly saldo?: number;
}