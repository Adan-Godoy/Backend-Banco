// src/fraude/fraude.service.ts (añadir método)
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../neo4j/neo4j.provider';
import * as crypto from 'crypto';

@Injectable()
export class FraudeService {
  private readonly logger = new Logger(FraudeService.name);

  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  async crearNodoUsuario(datos: { rut: string }): Promise<void> {
    const session = this.driver.session();
    try {
      this.logger.log(`Creando nodo de usuario en Neo4j para RUT: ${datos.rut}`);
      // MERGE asegura que no se creen duplicados si por alguna razón se llama dos veces
      await session.run('MERGE (u:Usuario { rut: $rut })', datos);
    } catch (error) {
      this.logger.error(`Error al crear nodo de usuario en Neo4j para RUT: ${datos.rut}`, error.stack);
      // Decidimos no lanzar un error para no fallar el registro completo, solo lo registramos.
    } finally {
      await session.close();
    }
  }

  async crearNodoTarjeta(datos: { usuarioRut: string, numeroTarjeta: string }): Promise<void> {
    const session = this.driver.session();
    try {
      // Por seguridad, en el grafo solo guardamos los últimos 4 dígitos visibles
      const ultimos4 = datos.numeroTarjeta.slice(-4);
      // Y un hash del número completo para poder buscarlo si es necesario, sin exponerlo
      const numeroCompletoHash = crypto.createHash('sha256').update(datos.numeroTarjeta).digest('hex');

      this.logger.log(`Creando nodo de tarjeta y relación en Neo4j para RUT: ${datos.usuarioRut}`);

      await session.run(
        `
        MERGE (u:Usuario { rut: $usuarioRut })
        MERGE (t:Tarjeta { ultimos4: $ultimos4, numeroHash: $numeroCompletoHash })
        MERGE (u)-[:TIENE_TARJETA]->(t)
        `,
        {
          usuarioRut: datos.usuarioRut,
          ultimos4: ultimos4,
          numeroCompletoHash: numeroCompletoHash,
        }
      );
    } catch (error) {
      this.logger.error(`Error al crear nodo de tarjeta en Neo4j para RUT: ${datos.usuarioRut}`, error.stack);
    } finally {
      await session.close();
    }
  }

  /**
   * Analiza una transacción propuesta y devuelve un veredicto.
   * @returns Un objeto con el veredicto: 'aprobar', 'bloquear', 'requiere_aprobacion'
   */
  async analizarTransaccion(datos: {
    monto: number;
    limiteSinAprobacion: number;
    // Aquí añadirías más datos para análisis de grafos, como:
    // dispositivoId: string;
    // ipAddress: string;
  }): Promise<{ veredicto: 'aprobar' | 'bloquear' | 'requiere_aprobacion'; motivo: string }> {
    
    // --- REGLA 1: Límite de compra sin aprobación del usuario ---
    if (datos.monto > datos.limiteSinAprobacion) {
      return {
        veredicto: 'requiere_aprobacion',
        motivo: `El monto S/.${datos.monto} excede el límite de S/.${datos.limiteSinAprobacion} para compras sin aprobación.`
      };
    }

    // --- REGLA 2 (Ejemplo con Grafos): Verificar si la IP es sospechosa ---
    // const esIpSospechosa = await this.verificarIpEnGrafo(datos.ipAddress);
    // if (esIpSospechosa) {
    //   return { veredicto: 'bloquear', motivo: 'La transacción se originó desde una IP marcada como fraudulenta.' };
    // }

    // Si pasa todas las reglas, se aprueba automáticamente.
    return { veredicto: 'aprobar', motivo: 'Transacción dentro de los límites y sin indicadores de fraude.' };
  }

  async crearNodoCuenta(datos: { usuarioRut: string, numeroCuenta: string, tipoCuenta: 'principal' | 'ahorro' }): Promise<void> {
    const session = this.driver.session();
    try {
      this.logger.log(`Creando nodo de Cuenta y relación para RUT: ${datos.usuarioRut}`);
      await session.run(
        `
        MERGE (u:Usuario { rut: $usuarioRut })
        MERGE (c:Cuenta { numero: $numeroCuenta, tipo: $tipoCuenta })
        MERGE (u)-[:POSEE]->(c)
        `,
        {
          usuarioRut: datos.usuarioRut,
          numeroCuenta: datos.numeroCuenta,
          tipoCuenta: datos.tipoCuenta,
        }
      );
    } catch (error) {
      this.logger.error('Error al crear nodo de Cuenta en Neo4j', error.stack);
    } finally {
      await session.close();
    }
  }

  async registrarTransferenciaEnGrafo(datos: {
    rutOrigen: string;
    rutDestino: string;
    monto: number;
    numeroCuentaOrigen: string;
    numeroCuentaDestino: string;
    transaccionId: string;
  }): Promise<void> {
    const session = this.driver.session();
    try {
      this.logger.log(`Registrando transferencia en Neo4j: ${datos.transaccionId}`);
      await session.run(
        `
        MATCH (co:Cuenta { numero: $numeroCuentaOrigen })
        MATCH (cd:Cuenta { numero: $numeroCuentaDestino })
        CREATE (co)-[r:TRANSFIRIO { monto: $monto, fecha: datetime(), id: $transaccionId }]->(cd)
        `,
        datos
      );
    } catch (error) {
      this.logger.error('Error al registrar transferencia en Neo4j', error.stack);
    } finally {
      await session.close();
    }
  }

  // ... otros métodos de fraude ...
}