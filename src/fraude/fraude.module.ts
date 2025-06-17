// src/fraude/fraude.module.ts
import { Module } from '@nestjs/common';
import { FraudeService } from './fraude.service';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule], // FraudeService necesita el driver de Neo4j
  providers: [FraudeService],
  exports: [FraudeService], // << MUY IMPORTANTE: Exportar el servicio
})
export class FraudeModule {}