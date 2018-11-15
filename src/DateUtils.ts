export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH28 = 28 * DAY;
export const MONTH29 = 29 * DAY;
export const MONTH30 = 30 * DAY;
export const MONTH31 = 31 * DAY;

export class DateUtils {
    public static parseDateString(dateString: string): number {
        return Date.parse(dateString);
    }

    public static timestampToDateString(timestamp: number, withTimezone: boolean = false): string {
        const date = new Date(timestamp);
        if (withTimezone) {
            date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        }
        const prefix = (s, p) => ('' + p + s).substring(('' + s).length);
        const prefix2 = (s) => prefix(s, '00');
        const prefix3 = (s) => prefix(s, '000');
        const datePart = `${date.getUTCFullYear()}-${prefix2(date.getUTCMonth() + 1)}-${prefix2(date.getUTCDate())}`;
        const timePart = `${prefix2(date.getUTCHours())}:${prefix2(date.getUTCMinutes())}:${prefix2(date.getUTCSeconds())}.${prefix3(date.getUTCMilliseconds())}`;
        return `${datePart}T${timePart}Z`;
    }

    public static printableElapsedTime(timestamp: number, now: number = Date.now()): string {
        const diff = new Date(now - timestamp);
        const pluralize = (s, num) => num > 1 ? s + 's' : s;

        const years = diff.getUTCFullYear() - 1970;
        if (years > 0) {
            return `${years} ${pluralize('year', years)}`;
        }

        const months = diff.getUTCMonth();
        if (months > 0) {
            return `${months} ${pluralize('month', months)}`;
        }

        const days = diff.getUTCDate() - 1;
        if (days >= 7) {
            const weeks = Math.floor(days / 7);
            return `${weeks} ${pluralize('week', weeks)}`;
        }
        if (days > 0) {
            return `${days} ${pluralize('day', days)}`;
        }

        const hours = diff.getUTCHours();
        if (hours > 0) {
            return `${hours} ${pluralize('hour', hours)}`;
        }

        const minutes = diff.getUTCMinutes();
        if (minutes > 0) {
            return `${minutes} ${pluralize('minute', minutes)}`;
        }

        return 'few seconds';
    }
}
