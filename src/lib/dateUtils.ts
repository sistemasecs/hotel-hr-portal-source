/**
 * Parses a date string in "YYYY-MM-DD" or "DD-MM-YYYY" format into a local Date object.
 * Always sets hours to 12:00:00 to avoid timezone boundary shifts during calculations.
 */
export const parseLocalDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  
  let year, month, day;
  
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      [year, month, day] = parts.map(Number);
    } else {
      // DD-MM-YYYY
      [day, month, year] = parts.map(Number);
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts[2].length === 4) {
      // DD/MM/YYYY
      [day, month, year] = parts.map(Number);
    } else if (parts[0].length === 4) {
      // YYYY/MM/DD
      [year, month, day] = parts.map(Number);
    }
  }

  if (year !== undefined && month !== undefined && day !== undefined) {
    // We use noon to ensure that even with a significant timezone shift, 
    // it remains the same calendar day.
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
};

/**
 * Gets the current date in a specific timezone (e.g. "America/Guatemala").
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
    hour12: false
  }).formatToParts(new Date());

  const map: any = {};
  parts.forEach(p => map[p.type] = p.value);
  
  return new Date(parseInt(map.year), parseInt(map.month) - 1, parseInt(map.day), parseInt(map.hour), parseInt(map.minute), parseInt(map.second));
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
 * Formats a Date or ISO string to a local datetime-local input value string
 * (e.g. "2025-12-25T14:00") anchored to a specific timezone.
 * Defaults to America/Guatemala (GMT-6).
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

  // Clamp 24 -> 00 edge case from Intl
  const hour = map.hour === '24' ? '00' : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
};

/**
 * Parses a datetime-local string (e.g. "2025-12-25T14:00") as if it is
 * in the hotel's local timezone and returns an ISO UTC string.
 * Defaults to America/Guatemala (GMT-6).
 */
export const parseGuatemalaDateTimeLocal = (
  datetimeLocalStr: string | null | undefined,
  timeZone: string = 'America/Guatemala'
): string => {
  if (!datetimeLocalStr) return new Date().toISOString();

  // Get the UTC offset for the timezone at this moment using Intl
  const testDate = new Date(datetimeLocalStr.replace('T', ' ') + ':00');
  if (isNaN(testDate.getTime())) return new Date().toISOString();

  // Build a fake ISO with the local datetime and resolve via Intl
  const [datePart, timePart] = datetimeLocalStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);

  // Use the timezone offset from Intl to reconstruct proper UTC
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  });
  const formatted = formatter.format(new Date());
  const offsetMatch = formatted.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : -6;

  const utc = new Date(
    Date.UTC(year, month - 1, day, hour - offsetHours, minute)
  );
  return utc.toISOString();
};

/**
 * Ensures a date value is returned as an ISO UTC string, converting from local
 * timezone if it is a plain date string (YYYY-MM-DD) or datetime-local string.
 * Defaults to America/Guatemala (GMT-6).
 */
export const ensureGuatemalaDate = (
  date: Date | string | null | undefined,
  timeZone: string = 'America/Guatemala'
): string => {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();

  // If it's already a full ISO string (has timezone info), return as-is
  if (typeof date === 'string' && (date.endsWith('Z') || date.includes('+'))) {
    return date;
  }

  // If it's a datetime-local string
  if (typeof date === 'string' && date.includes('T')) {
    return parseGuatemalaDateTimeLocal(date, timeZone);
  }

  // If it's just a date (YYYY-MM-DD), treat as local noon
  const d = parseLocalDate(date);
  return d.toISOString();
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
