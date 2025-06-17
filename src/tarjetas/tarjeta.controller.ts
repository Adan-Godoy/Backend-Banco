import { Controller, Get, Post, Request, UseGuards, Body, Param } from '@nestjs/common';
import { TarjetaService } from './tarjeta.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tarjetas')
@UseGuards(AuthGuard('jwt'))
export class TarjetaController {
  constructor(private readonly tarjetaService: TarjetaService) {}

  // << MODIFICADO >>
  @Post()
  create(@Request() req) {
    // Ya no hay un body. Toda la info viene del token.
    const usuarioId = req.user.userId;
    const usuarioRut = req.user.rut;
    return this.tarjetaService.create(usuarioId, usuarioRut);
  }

  @Get(':usuario_id')
  getByUsuario(@Param('usuario_id') usuario_id: string) {
    return this.tarjetaService.findByUsuario(usuario_id);
  }

  
}
