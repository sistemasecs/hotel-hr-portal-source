/**
 * Parses a date string into a local Date object set to noon (12:00).
 * Supports: "YYYY-MM-DD", "DD-MM-YYYY", full ISO timestamps "YYYY-MM-DDTHH:mm:ssZ".
 * Using noon prevents timezone shifts from bleeding into adjacent calendar days.
 */
export const parseLocalDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();

  // Strip time component from ISO timestamps (e.g. "2025-12-25T06:00:00.000Z")
  let str = typeof dateStr === 'string' && dateStr.includes('T')
    ? dateStr.split('T')[0]
    : dateStr;

  let year: number | undefined,
    month: number | undefined,
    day: number | undefined;

  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      [year, month, day] = parts.map(Number);
    } else {
      // DD-MM-YYYY
      [day, month, year] = parts.map(Number);
    }
  } else if (str.includes('/')) {
    const parts = str.split('/');
    if (parts[2]?.length === 4) {
      // DD/MM/YYYY
      [day, month, year] = parts.map(Number);
    } else if (parts[0]?.length === 4) {
      // YYYY/MM/DD
      [year, month, day] = parts.map(Number);
    }
  }

  if (year !== undefined && month !== undefined && day !== undefined) {
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  // Fallback: standard parse, then extract local components
  const d = new Date(str);
  if (isNaN(d.getTime())) return new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
};

/**
 * Gets the current date/time in a specific IANA timezone.
 */
export const nowInTimeZone = (timeZone: string = 'America/Guatemala'): Date => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  parts.forEach((p) => (map[p.type] = p.value));

  return new Date(
    parseInt(map.year),
    parseInt(map.month) - 1,
    parseInt(map.day),
    parseInt(map.hour),
    parseInt(map.minute),
    parseInt(map.second)
  );
};

/**
 * Formats a date to "DD-MM-YYYY" for user display.
 */
export const formatDisplayDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Formats a date to "YYYY-MM-DD" for storage/API use.
 */
export const toISO = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Formats a Date or ISO string to a datetime-local input value ("YYYY-MM-DDTHH:mm")
 * anchored to the hotel's local timezone. Defaults to America/Guatemala (GMT-6).
 */
export const formatToGuatemalaDateTimeLocal = (
  date: Date | string | null | undefined,
  timeZone: string = 'America/Guatemala'
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const map: Record<string, string> = {};
  parts.forEach((p) => (map[p.type] = p.value));

  const hour = map.hour === '24' ? '00' : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
};

/**
 * Parses a datetime-local string ("YYYY-MM-DDTHH:mm") as if it's in the hotel's
 * local timezone and returns an ISO UTC string.
 * Defaults to America/Guatemala (GMT-6).
 */
export const parseGuatemalaDateTimeLocal = (
  datetimeLocalStr: string | null | undefined,
  timeZone: string = 'America/Guatemala'
): string => {
  if (!datetimeLocalStr) return new Date().toISOString();

  const [datePart, timePart] = datetimeLocalStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  });
  const formatted = formatter.format(new Date());
  const offsetMatch = formatted.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : -6;

  const utc = new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute));
  return utc.toISOString();
};

/**
 * Ensures a date value is returned as an ISO UTC string, appropriately converted
 * from the hotel's local timezone if needed.
 * Defaults to America/Guatemala (GMT-6).
 */
export const ensureGuatemalaDate = (
  date: Date | string | null | undefined,
  timeZone: string = 'America/Guatemala'
): string => {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();

  // Already a full UTC ISO string
  if (date.endsWith('Z') || (date.includes('+') && date.includes('T'))) {
    return date;
  }

  // datetime-local string (no timezone info)
  if (date.includes('T')) {
    return parseGuatemalaDateTimeLocal(date, timeZone);
  }

  // Plain date (YYYY-MM-DD)
  const d = parseLocalDate(date);
  return d.toISOString();
};
