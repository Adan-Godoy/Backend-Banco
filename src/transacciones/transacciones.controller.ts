// src/transacciones/transacciones.controller.ts

import { Controller, Post, Body, UseGuards, Request, Get, Query, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransaccionesService } from './transacciones.service';
import { CrearTransferenciaDto } from './dto/crear-transferencia.dto';
import { CrearCompraDto } from './dto/crear-compra.dto';

@Controller('transacciones')
@UseGuards(AuthGuard('jwt'))
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) {}

  @Post('transferir')
  transferir(@Request() req, @Body() dto: CrearTransferenciaDto) {
    return this.transaccionesService.realizarTransferencia(dto, req.user.userId);
  }

  @Post('comprar')
  comprar(@Request() req, @Body() dto: CrearCompraDto) {
    return this.transaccionesService.realizarCompra(dto, req.user.userId);
  }
  
  @Get('historial')
  historial(@Request() req, @Query('page') page: number) {
    return this.transaccionesService.getHistorial(req.user.userId, page);
  }

  // ---- NUEVOS ENDPOINTS DE APROBACIÓN ----

  @Post(':id/aprobar')
  aprobarTransaccion(@Request() req, @Param('id') id: string) {
    return this.transaccionesService.gestionarAprobacion(id, req.user.userId, 'aprobar');
  }

  @Post(':id/rechazar')
  rechazarTransaccion(@Request() req, @Param('id') id: string) {
    return this.transaccionesService.gestionarAprobacion(id, req.user.userId, 'rechazar');
  }
}