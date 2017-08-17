export class DateUtils {
    static parseDateString(dateString: string): number {
        return Date.parse(dateString);
    }

    static parseTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const prefix = (s, p) => (''+p+s).substring(('' + s).length);
        const prefix2 = (s) => prefix(s, '00');
        const prefix3 = (s) => prefix(s, '000');
        const datePart = `${date.getUTCFullYear()}-${prefix2(date.getUTCMonth()+1)}-${prefix2(date.getUTCDate())}`;
        const timePart = `${prefix2(date.getUTCHours())}:${prefix2(date.getUTCMinutes())}:${prefix2(date.getUTCSeconds())}.${prefix3(date.getUTCMilliseconds())}`;
        return `${datePart}T${timePart}Z`;
    }

    static printableElapsedTime(timestamp: number, now: number = Date.now()): string {
        const diff = new Date(now - timestamp);

        if (diff.getUTCFullYear() > 1970) {
            return `${diff.getUTCFullYear() - 1970} years ago`;
        }

        if (diff.getUTCMonth() > 0) {
            return `${diff.getUTCMonth()} months ago`;
        }

        if (diff.getUTCDate() > 1) {
            return `${diff.getUTCDate() - 1} days ago`;
        }

        if (diff.getUTCHours() > 0) {
            return `${diff.getUTCHours() - 1} hours ago`;
        }

        if (diff.getUTCMinutes() > 0) {
            return `${diff.getUTCMinutes() - 1} minutes ago`;
        }

        return 'few seconds ago';
    }
}
