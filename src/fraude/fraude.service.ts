// src/fraude/fraude.service.ts (añadir método)
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../neo4j/neo4j.provider';

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

  // ... otros métodos de fraude ...
}