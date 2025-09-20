import { Module } from '@nestjs/common';
import { TerminalIntegrationService } from './terminal-integration.service';
import { TerminalsController } from './terminals.controller';

@Module({
  controllers: [TerminalsController],
  providers: [TerminalIntegrationService],
})
export class TerminalsModule {}
