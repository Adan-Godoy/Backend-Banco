import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TarjetaService } from './tarjeta.service';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';

@Controller('tarjetas')
export class TarjetaController {
  constructor(private readonly tarjetaService: TarjetaService) {}

  @Post()
  create(@Body() dto: CreateTarjetaDto) {
    return this.tarjetaService.create(dto);
  }

  @Get(':usuario_id')
  getByUsuario(@Param('usuario_id') usuario_id: string) {
    return this.tarjetaService.findByUsuario(usuario_id);
  }
}
