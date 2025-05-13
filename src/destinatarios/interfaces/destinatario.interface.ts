// src/destinatarios/interfaces/destinatario.interface.ts
export interface CreateDestinatarioDto {
  readonly rut_usuario: string;
  readonly alias: string;
  readonly rut_destinatario: string;
  readonly cuenta_destino_id?: string;
  readonly fecha_agregado: Date;
}
