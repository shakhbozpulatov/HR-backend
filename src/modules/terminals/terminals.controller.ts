import { Controller } from '@nestjs/common';
import { TerminalIntegrationService } from './terminal-integration.service';

@Controller('terminals')
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalIntegrationService) {}
}
