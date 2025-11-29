import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminalsController } from './terminals.controller';
import { TerminalsService } from './terminals.service';
import { TerminalHcIntegrationService } from './services/terminal-hc-integration.service';
import { TerminalDevice } from './entities/terminal-device.entity';
import { HcModule } from '@/modules/hc/hc.module';

@Module({
  imports: [TypeOrmModule.forFeature([TerminalDevice]), HcModule],
  controllers: [TerminalsController],
  providers: [TerminalsService, TerminalHcIntegrationService],
  exports: [TerminalsService, TerminalHcIntegrationService],
})
export class TerminalsModule {}
