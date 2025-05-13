// src/destinatarios/dto/create-destinatario.dto.ts
export class CreateDestinatarioDto {
  readonly rut_usuario: string;
  readonly alias: string;
  readonly rut_destinatario: string;
  readonly cuenta_destino_id?: string;
}
