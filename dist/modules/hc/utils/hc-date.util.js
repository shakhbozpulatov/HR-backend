"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HcDateFormatter = void 0;
class HcDateFormatter {
    static toHcFormat(dateInput) {
        const date = this.parseDate(dateInput);
        this.validateDate(date);
        return this.formatWithTimezone(date);
    }
    static parseDate(dateInput) {
        if (typeof dateInput === 'string') {
            return new Date(dateInput);
        }
        return dateInput;
    }
    static validateDate(date) {
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${date}`);
        }
    }
    static formatWithTimezone(date) {
        const datePart = this.formatDatePart(date);
        const timePart = this.formatTimePart(date);
        const timezonePart = this.formatTimezonePart(date);
        return `${datePart}T${timePart}${timezonePart}`;
    }
    static formatDatePart(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    static formatTimePart(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    static formatTimezonePart(date) {
        const timezoneOffset = -date.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
        const offsetMinutes = Math.abs(timezoneOffset) % 60;
        const offsetSign = timezoneOffset >= 0 ? '+' : '-';
        return `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    }
    static formatDates(dates) {
        const formatted = {};
        for (const [key, value] of Object.entries(dates)) {
            if (value) {
                formatted[key] = this.toHcFormat(value);
            }
            else {
                formatted[key] = undefined;
            }
        }
        return formatted;
    }
}
exports.HcDateFormatter = HcDateFormatter;
//# sourceMappingURL=hc-date.util.js.map