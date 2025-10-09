import { Injectable } from '@nestjs/common';
import moment from 'moment-timezone';

@Injectable()
export class TimeUtils {
  parseTimeString(
    timeStr: string,
    timezone: string = 'Asia/Tashkent',
  ): moment.Moment {
    return moment.tz(timeStr, 'HH:mm', timezone);
  }

  convertToTimezone(
    date: Date,
    timezone: string = 'Asia/Tashkent',
  ): moment.Moment {
    return moment.tz(date, timezone);
  }

  formatTime(date: Date, format: string = 'HH:mm'): string {
    return moment(date).format(format);
  }

  formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    return moment(date).format(format);
  }

  getDayOfWeek(date: Date): string {
    return moment(date).format('dddd');
  }

  isWeekend(date: Date): boolean {
    const day = moment(date).day();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  addMinutes(date: Date, minutes: number): Date {
    return moment(date).add(minutes, 'minutes').toDate();
  }

  diffInMinutes(start: Date, end: Date): number {
    return moment(end).diff(moment(start), 'minutes');
  }

  startOfDay(date: Date, timezone: string = 'Asia/Tashkent'): Date {
    return moment.tz(date, timezone).startOf('day').toDate();
  }

  endOfDay(date: Date, timezone: string = 'Asia/Tashkent'): Date {
    return moment.tz(date, timezone).endOf('day').toDate();
  }

  getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    const current = moment(startDate);
    const end = moment(endDate);

    while (current.isSameOrBefore(end)) {
      dates.push(current.toDate());
      current.add(1, 'day');
    }

    return dates;
  }
}
