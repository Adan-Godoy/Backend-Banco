export class CrearTransferenciaDto {
  readonly monto: number;
  readonly numero_cuenta_destino: string;
  // La cuenta de origen se deduce del usuario autenticado
}