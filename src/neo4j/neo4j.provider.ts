// src/neo4j/neo4j.provider.ts
import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

export const NEO4J_DRIVER = 'NEO4J_DRIVER';

export const neo4jProvider: Provider = {
  provide: NEO4J_DRIVER,
  // 'useFactory' permite inyectar dependencias como ConfigService
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const logger = new Logger('Neo4j');
    const uri = configService.get<string>('NEO4J_URI');
    const user = configService.get<string>('NEO4J_USERNAME');
    const password = configService.get<string>('NEO4J_PASSWORD');

    if (!uri || !user || !password) {
        logger.error('Faltan las credenciales de Neo4j en las variables de entorno.');
        throw new Error('Faltan las credenciales de Neo4j.');
    }

    logger.log('Conectando a Neo4j...');
    return neo4j.driver(uri, neo4j.auth.basic(user, password));
  },
};