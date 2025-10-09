import moment from 'moment-timezone';
export declare class TimeUtils {
    parseTimeString(timeStr: string, timezone?: string): moment.Moment;
    convertToTimezone(date: Date, timezone?: string): moment.Moment;
    formatTime(date: Date, format?: string): string;
    formatDate(date: Date, format?: string): string;
    getDayOfWeek(date: Date): string;
    isWeekend(date: Date): boolean;
    addMinutes(date: Date, minutes: number): Date;
    diffInMinutes(start: Date, end: Date): number;
    startOfDay(date: Date, timezone?: string): Date;
    endOfDay(date: Date, timezone?: string): Date;
    getDateRange(startDate: Date, endDate: Date): Date[];
}
