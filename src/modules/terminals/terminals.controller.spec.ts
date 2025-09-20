import { Test, TestingModule } from '@nestjs/testing';
import { TerminalsController } from './terminals.controller';
import { TerminalIntegrationService } from './terminal-integration.service';

describe('TerminalsController', () => {
  let controller: TerminalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TerminalsController],
      providers: [TerminalIntegrationService],
    }).compile();

    controller = module.get<TerminalsController>(TerminalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
