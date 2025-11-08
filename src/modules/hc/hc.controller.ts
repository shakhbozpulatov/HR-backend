import { Controller } from '@nestjs/common';
import { HcService } from './hc.service';

@Controller('hc')
export class HcController {
  constructor(private readonly hcService: HcService) {}
}
