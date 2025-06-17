// src/neo4j/neo4j.module.ts
import { Module } from '@nestjs/common';
import { neo4jProvider } from './neo4j.provider';
import { ConfigModule } from '@nestjs/config'; 

@Module({
  imports: [ConfigModule], 
  providers: [neo4jProvider],
  exports: [neo4jProvider], // Exportamos para que otros módulos puedan inyectar el driver
})
export class Neo4jModule {}
