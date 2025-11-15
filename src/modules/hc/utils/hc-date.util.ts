/**
 * HC Date Formatter Utility
 * Single Responsibility: Format dates for HC API
 */
export class HcDateFormatter {
  /**
   * Format date to ISO 8601 with timezone for HC API
   * Required format: 2023-10-21T11:08:23+08:00
   *
   * @param dateInput - Date object, ISO string, or YYYY-MM-DD string
   * @returns ISO 8601 string with timezone
   */
  static toHcFormat(dateInput: string | Date): string {
    const date = this.parseDate(dateInput);
    this.validateDate(date);

    return this.formatWithTimezone(date);
  }

  /**
   * Parse input to Date object
   */
  private static parseDate(dateInput: string | Date): Date {
    if (typeof dateInput === 'string') {
      return new Date(dateInput);
    }
    return dateInput;
  }

  /**
   * Validate date is valid
   */
  private static validateDate(date: Date): void {
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${date}`);
    }
  }

  /**
   * Format date with timezone offset
   */
  private static formatWithTimezone(date: Date): string {
    const datePart = this.formatDatePart(date);
    const timePart = this.formatTimePart(date);
    const timezonePart = this.formatTimezonePart(date);

    return `${datePart}T${timePart}${timezonePart}`;
  }

  /**
   * Format date part (YYYY-MM-DD)
   */
  private static formatDatePart(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Format time part (HH:mm:ss)
   */
  private static formatTimePart(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Format timezone part (+HH:mm or -HH:mm)
   */
  private static formatTimezonePart(date: Date): string {
    const timezoneOffset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';

    return `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  }

  /**
   * Format multiple dates at once
   */
  static formatDates(
    dates: Record<string, string | Date | undefined>,
  ): Record<string, string | undefined> {
    const formatted: Record<string, string | undefined> = {};

    for (const [key, value] of Object.entries(dates)) {
      if (value) {
        formatted[key] = this.toHcFormat(value);
      } else {
        formatted[key] = undefined;
      }
    }

    return formatted;
  }
}
