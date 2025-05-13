import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // opcional si encriptas contraseñas

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async validateUser(rut: string, password: string): Promise<any> {
    const user = await this.usuariosService.findByRut(rut);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // Si usas bcrypt para hash de contraseñas
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Contraseña incorrecta');

    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(user: any) {
    const payload = { sub: user._id, rut: user.rut };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: any) {
    // puedes encriptar la contraseña aquí
    data.password = await bcrypt.hash(data.password, 10);
    return this.usuariosService.create(data);
  }
}
