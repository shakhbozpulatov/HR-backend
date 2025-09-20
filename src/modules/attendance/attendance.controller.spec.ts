import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceEventsController } from './attendance-events.controller';
import { AttendanceProcessorService } from './attendance-processor.service';

describe('AttendanceEventsController', () => {
  let controller: AttendanceEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceEventsController],
      providers: [AttendanceProcessorService],
    }).compile();

    controller = module.get<AttendanceEventsController>(
      AttendanceEventsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
