export declare class HcDateFormatter {
    static toHcFormat(dateInput: string | Date): string;
    private static parseDate;
    private static validateDate;
    private static formatWithTimezone;
    private static formatDatePart;
    private static formatTimePart;
    private static formatTimezonePart;
    static formatDates(dates: Record<string, string | Date | undefined>): Record<string, string | undefined>;
}
