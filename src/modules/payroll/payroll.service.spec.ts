import { Test, TestingModule } from '@nestjs/testing';
import { PayrollProcessorService } from './payroll-processor.service';

describe('PayrollProcessorService', () => {
  let service: PayrollProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollProcessorService],
    }).compile();

    service = module.get<PayrollProcessorService>(PayrollProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
