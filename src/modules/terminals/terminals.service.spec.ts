import { Test, TestingModule } from '@nestjs/testing';
import { TerminalIntegrationService } from './terminal-integration.service';

describe('TerminalIntegrationService', () => {
  let service: TerminalIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TerminalIntegrationService],
    }).compile();

    service = module.get<TerminalIntegrationService>(
      TerminalIntegrationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
