// src/tarjeta/dto/create-tarjeta.dto.ts

export class CreateTarjetaDto {
  readonly usuario_id: string;
  readonly cuenta_id: string;
  readonly numero: string;
  readonly cvv: string;
  readonly fecha_vencimiento: Date;
  readonly estado?: 'activa' | 'bloqueada';
  readonly limites?: {
    monto_diario: number;
    compras_sin_aprobacion: number;
  };
}
