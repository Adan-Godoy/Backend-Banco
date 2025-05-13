import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';


@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}


  @Get('perfil')
  async getPerfil(@Req() req) {
    // req.user lo provee jwt.strategy.ts
    return this.usuariosService.findByRut(req.user.rut);
  }

  @Get(':rut')
  async getUsuarioPorRut(@Param('rut') rut: string) {
    return this.usuariosService.findByRut(rut);
  }
}
