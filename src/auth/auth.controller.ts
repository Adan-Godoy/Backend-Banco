import { Controller, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport'; // << NUEVA LÍNEA
import { ChangePasswordDto } from './dto/change-password.dto'; // << NUEVA LÍNEA

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.rut, loginDto.password);
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('jwt')) // << Proteger la ruta
  @Patch('change-password')
  async changePassword(
    @Request() req, // Para obtener el usuario del token
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    // req.user.sub contiene el ID del usuario extraído del JWT
    const userId = req.user.userId; 
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
