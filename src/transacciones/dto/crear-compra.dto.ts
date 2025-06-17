export class CrearCompraDto {
  readonly monto: number;
  readonly numero_tarjeta: string;
  readonly cvv_tarjeta: string;
  readonly fecha_vencimiento_tarjeta: string; // Formato "MM/YY"
  readonly nombre_comercio: string;
}