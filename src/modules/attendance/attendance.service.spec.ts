import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceProcessorService } from './attendance-processor.service';

describe('AttendanceProcessorService', () => {
  let service: AttendanceProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceProcessorService],
    }).compile();

    service = module.get<AttendanceProcessorService>(
      AttendanceProcessorService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
