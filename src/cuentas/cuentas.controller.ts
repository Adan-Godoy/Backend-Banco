import { Controller, Get, Param } from '@nestjs/common';
import { CuentasService } from './cuentas.service';

@Controller('cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  @Get(':usuario_id')
  findByUsuario(@Param('usuario_id') usuario_id: string) {
    return this.cuentasService.findByUsuario(usuario_id);
  }
}
