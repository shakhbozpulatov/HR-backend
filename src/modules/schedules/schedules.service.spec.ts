import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleTemplatesService } from './schedule-templates.service';

describe('ScheduleTemplatesService', () => {
  let service: ScheduleTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleTemplatesService],
    }).compile();

    service = module.get<ScheduleTemplatesService>(ScheduleTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
