// src/cuentas/dto/transferencia-interna.dto.ts
export class TransferenciaInternaDto {
  readonly monto: number;
  readonly cuentaOrigenId: string;
  readonly cuentaDestinoId: string;
}