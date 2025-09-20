import { Repository } from 'typeorm';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';
export declare class HolidaysService {
    private holidayRepository;
    constructor(holidayRepository: Repository<Holiday>);
    create(createHolidayDto: CreateHolidayDto): Promise<Holiday>;
    findAll(year?: number, location?: string): Promise<Holiday[]>;
    findOne(id: string): Promise<Holiday>;
    update(id: string, updateHolidayDto: Partial<CreateHolidayDto>): Promise<Holiday>;
    remove(id: string): Promise<void>;
    isHoliday(date: Date, location?: string): Promise<boolean>;
    getHolidaysForDateRange(startDate: Date, endDate: Date, location?: string): Promise<Holiday[]>;
}
