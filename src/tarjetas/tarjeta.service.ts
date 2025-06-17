import { Injectable, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CuentasService } from '../cuentas/cuentas.service';
import { FraudeService } from '../fraude/fraude.service';
import { Usuario } from 'src/usuarios/schemas/usuario.schema';
import { Cuenta } from 'src/cuentas/schemas/cuenta.schema';
import { Tarjeta, TarjetaDocument } from './schemas/tarjeta.schema';

// Definimos un tipo para los datos de validación
interface ValidacionTarjetaData {
  numero: string;
  cvv: string;
  fecha_vencimiento: string; // "MM/YY"
}

@Injectable()
export class TarjetaService {
  constructor(
    @InjectModel(Tarjeta.name) private readonly tarjetaModel: Model<Tarjeta>,
    @InjectModel('Usuario') private readonly usuarioModel: Model<Usuario>,
    @InjectModel(Cuenta.name) private readonly cuentaModel: Model<Cuenta>,
    private readonly cuentasService: CuentasService,
    private readonly fraudeService: FraudeService,
) {}

  // << MODIFICADO >>
  async create(usuarioId: string, usuarioRut: string): Promise<TarjetaDocument> {
    // 1. Validar límite de tarjetas
    const tarjetasActuales = await this.tarjetaModel.countDocuments({ usuario_id: usuarioId });
    if (tarjetasActuales >= 20) {
      throw new ForbiddenException('Ha alcanzado el límite de 20 tarjetas virtuales.');
    }

    // 2. Encontrar automáticamente la cuenta principal del usuario
    const cuentasUsuario = await this.cuentasService.findByUsuario(usuarioId);
    const cuentaPrincipal = cuentasUsuario.find(c => c.tipo === 'principal');

    if (!cuentaPrincipal) {
      // Este error no debería ocurrir si el flujo de registro es correcto
      throw new NotFoundException('No se encontró la cuenta principal del usuario.');
    }

    // 3. Generar datos de la tarjeta de forma segura
    const numeroTarjeta = this.generarNumeroTarjeta();
    const cvv = this.generarCVV();
    const fechaVencimiento = new Date();
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 3);

    // 4. Crear y guardar la tarjeta en MongoDB
    const nuevaTarjeta = new this.tarjetaModel({
      usuario_id: usuarioId,
      cuenta_id: cuentaPrincipal._id, // Usamos el ID de la cuenta principal encontrada
      numero: numeroTarjeta,
      cvv,
      fecha_vencimiento: fechaVencimiento,
    });
    
    const tarjetaGuardada = await nuevaTarjeta.save();

    // 5. Registrar la tarjeta en Neo4j en segundo plano
    this.fraudeService.crearNodoTarjeta({ 
        usuarioRut: usuarioRut, 
        numeroTarjeta: tarjetaGuardada.numero 
    });

    return tarjetaGuardada;
  }

  async findByUsuario(usuario_id: string): Promise<Tarjeta[]> {
    return this.tarjetaModel.find({ usuario_id }).exec();
  }

  async remove(tarjetaId: string, usuarioId: string): Promise<void> {
    const result = await this.tarjetaModel.deleteOne({ _id: tarjetaId, usuario_id: usuarioId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Tarjeta no encontrada o no pertenece al usuario.');
    }
  }

  private generarNumeroTarjeta(): string {
    // Genera un número de 16 dígitos que empieza con 4 (simulando Visa)
    let numero = '4';
    for (let i = 0; i < 15; i++) {
      numero += Math.floor(Math.random() * 10);
    }
    // Puedes añadir un algoritmo de Luhn para que sea más realista, pero esto es suficiente
    return numero;
  }

  private generarCVV(): string {
    // Genera un número de 3 dígitos
    const cvv = Math.floor(100 + Math.random() * 900);
    return cvv.toString();
  }

  /**
   * Valida los datos de una tarjeta y si son correctos, devuelve el documento de la tarjeta.
   */
  async validarYObtenerTarjeta(data: ValidacionTarjetaData): Promise<TarjetaDocument> {
    const tarjeta = await this.tarjetaModel.findOne({ numero: data.numero }).exec();

    if (!tarjeta) {
      throw new NotFoundException('La tarjeta no existe.');
    }

    if (tarjeta.cvv !== data.cvv) {
      throw new UnauthorizedException('CVV incorrecto.');
    }
    
    // Validar fecha de vencimiento
    const [mes, anio] = data.fecha_vencimiento.split('/');
    const fechaVencimientoInput = new Date(parseInt(`20${anio}`), parseInt(mes));
    // La fecha de vencimiento real es el último día del mes
    const fechaVencimientoReal = new Date(tarjeta.fecha_vencimiento.getFullYear(), tarjeta.fecha_vencimiento.getMonth() + 1, 0);

    if (fechaVencimientoInput.getTime() !== fechaVencimientoReal.getTime()) {
      throw new UnauthorizedException('Fecha de vencimiento incorrecta.');
    }

    if (new Date() > tarjeta.fecha_vencimiento) {
      throw new BadRequestException('La tarjeta ha expirado.');
    }
    
    if (tarjeta.estado !== 'activa') {
      throw new ForbiddenException('La tarjeta no está activa.');
    }

    return tarjeta;
  }
}

