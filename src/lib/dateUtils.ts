/**
 * dateUtils.ts
 * Utilities for handling Guatemala (GMT-6) timezone across the portal.
 */

/**
 * Converts a Date object or ISO string to a YYYY-MM-DDTHH:mm string in Guatemala (GMT-6) timezone
 * for use in <input type="datetime-local" />
 */
export function formatToGuatemalaDateTimeLocal(date: Date | string | null): string {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    // Guatemala is always GMT-6
    // We manually shift the date for the "local" ISO string representation
    const offset = -6 * 60; // 6 hours in minutes
    const guatemalaDate = new Date(d.getTime() + (offset + d.getTimezoneOffset()) * 60000);

    const year = guatemalaDate.getFullYear();
    const month = String(guatemalaDate.getMonth() + 1).padStart(2, '0');
    const day = String(guatemalaDate.getDate()).padStart(2, '0');
    const hours = String(guatemalaDate.getHours()).padStart(2, '0');
    const minutes = String(guatemalaDate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parses a YYYY-MM-DDTHH:mm string from a datetime-local input as Guatemala (GMT-6) time
 * and returns its ISO string (UTC) for database storage.
 */
export function parseGuatemalaDateTimeLocal(dateTimeStr: string | null): string {
    if (!dateTimeStr) return "";

    // input is "YYYY-MM-DDTHH:mm"
    // We append the Guatemala offset "-06:00"
    return `${dateTimeStr}:00.000-06:00`;
}

/**
 * Ensures a date string or object is interpreted as America/Guatemala (GMT-6).
 * If the input string lacks a timezone offset, it appends -06:00.
 */
export function ensureGuatemalaDate(date: Date | string | null): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;

    // If it's a string and doesn't have a 'Z' or a '+' or '-' for offset
    if (typeof date === 'string' && !date.includes('Z') && !/\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(date)) {
        // Check if it has a T or space
        const separator = date.includes('T') ? 'T' : ' ';
        const parts = date.split(separator);
        const datePart = parts[0];
        let timePart = parts[1] || "00:00:00";

        // Ensure timePart has seconds for compatibility
        if (timePart.split(':').length === 2) timePart += ":00";

        return new Date(`${datePart}T${timePart}.000-06:00`);
    }

    return new Date(date);
}

/**
 * Gets a Date object representing the start of a day (00:00:00) in Guatemala timezone
 * from a standard Date object.
 */
export function getGuatemalaStartOfDay(date: Date): Date {
    const d = new Date(date);
    // Formatting as ISO with GMT-6 offset for 00:00:00
    const dateStr = d.toISOString().split('T')[0];
    return new Date(`${dateStr}T00:00:00.000-06:00`);
}
