export class DateUtils {
    static parseDateString(dateString: string): number {
        return Date.parse(dateString);
    }

    static timestampToDateString(timestamp: number): string {
        const date = new Date(timestamp);
        const prefix = (s, p) => ('' + p + s).substring(('' + s).length);
        const prefix2 = (s) => prefix(s, '00');
        const prefix3 = (s) => prefix(s, '000');
        const datePart = `${date.getUTCFullYear()}-${prefix2(date.getUTCMonth()+1)}-${prefix2(date.getUTCDate())}`;
        const timePart = `${prefix2(date.getUTCHours())}:${prefix2(date.getUTCMinutes())}:${prefix2(date.getUTCSeconds())}.${prefix3(date.getUTCMilliseconds())}`;
        return `${datePart}T${timePart}Z`;
    }

    static printableElapsedTime(timestamp: number, now: number = Date.now()): string {
        const diff = new Date(now - timestamp);
        const pluralize = (s, num) => num > 1 ? s + 's' : s;

        const years = diff.getUTCFullYear() - 1970;
        if (years > 0) {
            return `${years} ${pluralize('year', years)} ago`;
        }

        const months = diff.getUTCMonth();
        if (months > 0) {
            return `${months} ${pluralize('month', months)} ago`;
        }

        const days = diff.getUTCDate() - 1;
        if (days > 0) {
            return `${days} ${pluralize('day', days)} ago`;
        }

        const hours = diff.getUTCHours() - 1;
        if (hours > 0) {
            return `${hours} ${pluralize('hour', hours)} ago`;
        }

        const minutes = diff.getUTCMinutes() - 1;
        if (minutes > 0) {
            return `${minutes} ${pluralize('minute', minutes)} ago`;
        }

        return 'few seconds ago';
    }
}
