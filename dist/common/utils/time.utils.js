"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeUtils = void 0;
const common_1 = require("@nestjs/common");
const moment = require("moment-timezone");
let TimeUtils = class TimeUtils {
    parseTimeString(timeStr, timezone = 'Asia/Tashkent') {
        return moment.tz(timeStr, 'HH:mm', timezone);
    }
    convertToTimezone(date, timezone = 'Asia/Tashkent') {
        return moment.tz(date, timezone);
    }
    formatTime(date, format = 'HH:mm') {
        return moment(date).format(format);
    }
    formatDate(date, format = 'YYYY-MM-DD') {
        return moment(date).format(format);
    }
    getDayOfWeek(date) {
        return moment(date).format('dddd');
    }
    isWeekend(date) {
        const day = moment(date).day();
        return day === 0 || day === 6;
    }
    addMinutes(date, minutes) {
        return moment(date).add(minutes, 'minutes').toDate();
    }
    diffInMinutes(start, end) {
        return moment(end).diff(moment(start), 'minutes');
    }
    startOfDay(date, timezone = 'Asia/Tashkent') {
        return moment.tz(date, timezone).startOf('day').toDate();
    }
    endOfDay(date, timezone = 'Asia/Tashkent') {
        return moment.tz(date, timezone).endOf('day').toDate();
    }
    getDateRange(startDate, endDate) {
        const dates = [];
        const current = moment(startDate);
        const end = moment(endDate);
        while (current.isSameOrBefore(end)) {
            dates.push(current.toDate());
            current.add(1, 'day');
        }
        return dates;
    }
};
exports.TimeUtils = TimeUtils;
exports.TimeUtils = TimeUtils = __decorate([
    (0, common_1.Injectable)()
], TimeUtils);
//# sourceMappingURL=time.utils.js.map