// src/cuentas/cuentas.controller.ts
import { Controller, Get, Param, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CuentasService } from './cuentas.service';
import { TransferenciaInternaDto } from './dto/transferencia-interna.dto';

@Controller('cuentas')
@UseGuards(AuthGuard('jwt')) // Proteger todo el controlador
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  @Get()
  findByUsuario(@Request() req) {
    // ---- LOG DE DEPURACIÓN #3 ----
    console.log('[DEBUG] req.user en CuentasController:', req.user);
    
    // ---- LOG DE DEPURACIÓN #4 ----
    const userId = req.user.userId;
    console.log(`[DEBUG] userId que se pasará al servicio: ${userId} (Tipo: ${typeof userId})`);

    return this.cuentasService.findByUsuario(userId);
  }

  @Post('transferencia-interna')
  transferirEntreCuentas(
      @Request() req, 
      @Body() transferenciaDto: TransferenciaInternaDto
  ) {
      const usuarioId = req.user.userId;
      return this.cuentasService.transferirEntreCuentasPropias(usuarioId, transferenciaDto);
  }
}