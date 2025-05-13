// src/destinatarios/destinatario.controller.ts
import { Controller, Post, Get, Param, Body, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { DestinatarioService } from './destinatario.service';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { Destinatario } from './schemas/destinatario.schema';

@Controller('destinatarios')
export class DestinatarioController {
  constructor(private readonly destinatarioService: DestinatarioService) {}

  // Crear un destinatario
  @Post()
  async create(@Body() createDestinatarioDto: CreateDestinatarioDto): Promise<Destinatario> {
    try {
      // Validamos si los datos necesarios existen en la base de datos
      return await this.destinatarioService.create(createDestinatarioDto);
    } catch (error) {
      // Si ocurre un error, lo manejamos y lanzamos una excepción HTTP con el mensaje adecuado
      throw new HttpException(error.message || 'Error al crear destinatario', HttpStatus.BAD_REQUEST);
    }
  }

  // Obtener destinatarios por rut_usuario
  @Get(':rut_usuario')
  async findByRutUsuario(@Param('rut_usuario') rut_usuario: string): Promise<Destinatario[]> {
    try {
      return await this.destinatarioService.findByRutUsuario(rut_usuario);
    } catch (error) {
      throw new HttpException(error.message || 'Error al obtener destinatarios', HttpStatus.BAD_REQUEST);
    }
  }

  // Obtener un destinatario por ID
  @Get('id/:id')
  async findOne(@Param('id') id: string): Promise<Destinatario> {
    try {
      return await this.destinatarioService.findOne(id);
    } catch (error) {
      throw new HttpException(error.message || 'Error al obtener destinatario', HttpStatus.BAD_REQUEST);
    }
  }

  // Eliminar un destinatario
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    try {
      return await this.destinatarioService.remove(id);
    } catch (error) {
      throw new HttpException(error.message || 'Error al eliminar destinatario', HttpStatus.BAD_REQUEST);
    }
  }
}
