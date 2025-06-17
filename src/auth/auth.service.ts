import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Opcional, solo si estás encriptando contraseñas
import { FraudeService } from '../fraude/fraude.service'; // << NUEVA LÍNEA
import { ChangePasswordDto } from './dto/change-password.dto'; // << NUEVA LÍNEA
import { RegisterDto } from './dto/register.dto';
import { Usuario, UsuarioDocument  } from '../usuarios/schemas/usuario.schema'; // Importa el tipo de Usuario
import { CuentasService } from '../cuentas/cuentas.service'; // << Añadir import

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private fraudeService: FraudeService, // << NUEVA LÍNEA: Inyectar servicio
    private cuentasService: CuentasService,
  ) {}

  async validateUser(rut: string, password: string): Promise<UsuarioDocument> { // << Cambia el tipo de retorno
    const user = await this.usuariosService.findByRut(rut);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // <<<< SOLUCIÓN >>>>
    // Devuelve el documento de Mongoose completo, no el objeto simple.
    return user;
  }

  async login(user: any) {
    const payload = { sub: user._id, rut: user.rut };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto): Promise<Omit<Usuario, 'password'>> {
    // 1. Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 2. Crear el usuario en MongoDB
    const newUserDocument = await this.usuariosService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // 3. Crear las dos cuentas para el nuevo usuario
    // SOLUCIÓN: Convertimos el _id a string para asegurar el tipo correcto.
    const userId = (newUserDocument as UsuarioDocument)._id;
    await this.cuentasService.crearCuentasParaNuevoUsuario(
      (newUserDocument as UsuarioDocument)._id,
      newUserDocument.rut,
    );
    // 4. Crear el nodo en Neo4j en segundo plano
    this.fraudeService.crearNodoUsuario({ rut: newUserDocument.rut });

    // 5. Devolver el usuario creado
    const { password, ...result } = newUserDocument.toObject();
    return result;
  }


  // << NUEVO MÉTODO >>
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;

    // 1. Obtener el usuario completo (incluyendo la contraseña hasheada)
    const user = await this.usuariosService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Verificar la contraseña antigua
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña antigua es incorrecta.');
    }

    // 3. Hashear y guardar la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usuariosService.updatePassword(userId, hashedNewPassword);

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
