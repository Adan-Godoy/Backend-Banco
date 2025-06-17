// src/fraude/fraude.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { FraudeService } from './fraude.service';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { CuentasModule } from 'src/cuentas/cuentas.module';

@Module({
  imports: [Neo4jModule,
    forwardRef(() => CuentasModule),
  ], // FraudeService necesita el driver de Neo4j
  providers: [FraudeService],
  exports: [FraudeService], // << MUY IMPORTANTE: Exportar el servicio
})
export class FraudeModule {}