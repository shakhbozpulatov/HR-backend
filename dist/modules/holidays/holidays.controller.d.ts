import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
export declare class HolidaysController {
    private readonly holidaysService;
    constructor(holidaysService: HolidaysService);
    create(createHolidayDto: CreateHolidayDto): Promise<import("./entities/holiday.entity").Holiday>;
    findAll(year?: number, location?: string): Promise<import("./entities/holiday.entity").Holiday[]>;
    findOne(id: string): Promise<import("./entities/holiday.entity").Holiday>;
    update(id: string, updateHolidayDto: Partial<CreateHolidayDto>): Promise<import("./entities/holiday.entity").Holiday>;
    remove(id: string): Promise<{
        message: string;
    }>;
    checkHoliday(date: string, location?: string): Promise<{
        date: string;
        isHoliday: boolean;
    }>;
}
