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
