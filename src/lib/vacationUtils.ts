import { EmployeeRequest } from '@/types';
import { parseLocalDate, formatDisplayDate } from './dateUtils';

/**
 * Calculates the number of days between two dates inclusive.
 * Assumes dates are in YYYY-MM-DD format.
 */
export const getDurationInDays = (startDate: string, endDate: string, holidays: any[] = [], workingDays: number[] = [0, 1, 2, 3, 4, 5, 6]): number => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0=Sunday, 1=Monday...
    const isWorkingDay = workingDays.includes(dayOfWeek);
    
    if (isWorkingDay) {
      const isHoliday = holidays.some(h => {
        const hStart = parseLocalDate(h.start_date);
        const hEnd = parseLocalDate(h.end_date);
        // Compare by date components to avoid any hour-level mismatch
        const curDay = current.getFullYear() * 10000 + (current.getMonth() + 1) * 100 + current.getDate();
        const startDay = hStart.getFullYear() * 10000 + (hStart.getMonth() + 1) * 100 + hStart.getDate();
        const endDay = hEnd.getFullYear() * 10000 + (hEnd.getMonth() + 1) * 100 + hEnd.getDate();
        return curDay >= startDay && curDay <= endDay;
      });
      
      if (!isHoliday) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Calculates total accrued vacation days since hire date (15 days per completed year).
 */
export const getAccruedDays = (hireDate: string, currentDate: string = new Date().toISOString().split('T')[0]): number => {
  const hire = parseLocalDate(hireDate);
  const current = parseLocalDate(currentDate);
  
  if (isNaN(hire.getTime()) || isNaN(current.getTime())) {
    return 0;
  }
  
  let years = current.getFullYear() - hire.getFullYear();
  
  // Adjust if anniversary hasn't happened yet this year
  const anniversaryThisYear = new Date(current.getFullYear(), hire.getMonth(), hire.getDate());
  if (current < anniversaryThisYear) {
    years--;
  }
  
  return Math.max(0, years * 15);
};

export interface VacationYearBreakdown {
  yearNumber: number;
  periodStart: string;
  periodEnd: string;
  accrued: number;
  taken: number;
  remaining: number;
  requests: EmployeeRequest[];
}

/**
 * Groups approved vacation requests by employment year.
 */
export const getVacationHistory = (hireDate: string, requests: EmployeeRequest[], yearlyDocs: any[] = [], holidays: any[] = [], workingDays: number[] = [0, 1, 2, 3, 4, 5, 6]): VacationYearBreakdown[] => {
  const hire = parseLocalDate(hireDate);
  const now = new Date();
  const approvedVacations = requests.filter(r => r.type === 'Vacation' && r.status === 'Approved' && r.isSigned);
  
  const history: VacationYearBreakdown[] = [];
  let currentStart = new Date(hire);
  let yearNum = 1;
  
  while (currentStart < now) {
    const periodStart = new Date(currentStart);
    const periodEnd = new Date(currentStart);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
    
    // Period string formats
    const startStr = formatDisplayDate(periodStart);
    const endStr = formatDisplayDate(periodEnd);
    
    // Find requests that fall within this year
    const yearRequests = approvedVacations.filter(r => {
      const reqStart = parseLocalDate(r.data.startDate);
      return reqStart >= periodStart && reqStart <= periodEnd;
    });
 
    // Check for a signed yearly summary for this specific year
    const yearlyDoc = yearlyDocs.find(doc => 
      doc.is_signed && 
      doc.request_id && doc.request_id.endsWith(`:${yearNum}`)
    );
 
    const takenFromRequests = yearRequests.reduce((sum, r) => sum + getDurationInDays(r.data.startDate, r.data.endDate, holidays, workingDays), 0);
    const takenFromYearly = (yearlyDoc && yearlyDoc.data && yearlyDoc.data.manualDays) ? (yearlyDoc.data.manualDays || 0) : 0;
    
    const taken = takenFromRequests + takenFromYearly;
    const accrued = 15;
    
    history.push({
      yearNumber: yearNum,
      periodStart: startStr,
      periodEnd: endStr,
      accrued,
      taken,
      remaining: accrued - taken,
      requests: yearRequests
    });
    
    currentStart.setFullYear(currentStart.getFullYear() + 1);
    yearNum++;
  }
  
  return history.reverse(); // Newest years first
};
 
/**
 * Calculates total balance.
 */
export const calculateVacationBalance = (
  hireDate: string,
  requests: EmployeeRequest[],
  yearlyDocs: any[] = [],
  holidays: any[] = [],
  workingDays: number[] = [0, 1, 2, 3, 4, 5, 6],
  employmentType?: 'Contract' | 'Weekly',
  contractSigningDate?: string | null
) => {
  const hasHireDate = Boolean(hireDate);
  const isWeekly = employmentType === 'Weekly';
  const isContract = employmentType === 'Contract';
  const hasSignedContract = Boolean(contractSigningDate);

  let eligibleAccrualStart: string | null = null;

  if (hasHireDate && !isWeekly) {
    if (!isContract) {
      eligibleAccrualStart = hireDate;
    } else if (hasSignedContract) {
      const hire = parseLocalDate(hireDate);
      const contract = parseLocalDate(contractSigningDate as string);
      eligibleAccrualStart = hire > contract ? hireDate : (contractSigningDate as string);
    }
  }

  const accrued = eligibleAccrualStart ? getAccruedDays(eligibleAccrualStart) : 0;
  const baselineDate = eligibleAccrualStart ? parseLocalDate(eligibleAccrualStart) : null;

  // Policy A: only Approved + Signed vacations count as taken
  const approvedVacations = requests.filter(r => {
    if (!(r.type === 'Vacation' && r.status === 'Approved' && r.isSigned)) return false;
    if (!baselineDate) return true;
    const reqStart = parseLocalDate(r.data.startDate);
    return reqStart >= baselineDate;
  });

  const takenFromRequests = approvedVacations.reduce(
    (sum, r) => sum + getDurationInDays(r.data.startDate, r.data.endDate, holidays, workingDays),
    0
  );

  // Reset-safe yearly handling:
  // signed YEARLY docs are authoritative snapshots for historical taken days.
  // Use manualDays (Option A) when present, otherwise 0 for that signed year.
  const takenFromYearly = yearlyDocs
    .filter(doc => {
      const signed = doc?.is_signed === true || doc?.isSigned === true;
      if (!signed) return false;
      if (!doc?.request_id || typeof doc.request_id !== 'string') return false;
      return doc.request_id.startsWith('YEARLY:');
    })
    .reduce((sum, doc) => {
      const manual = doc?.data?.manualDays;
      if (typeof manual === 'number') return sum + manual;
      if (typeof manual === 'string') {
        const parsed = Number(manual);
        return sum + (Number.isFinite(parsed) ? parsed : 0);
      }
      return sum;
    }, 0);

  const taken = takenFromRequests + takenFromYearly;

  return {
    accrued,
    taken,
    balance: Math.max(0, accrued - taken)
  };
};

/**
 * Calculates days since the end of the most recent approved vacation.
 * Returns null if no vacations have been taken.
 */
export const getDaysSinceLastVacation = (requests: EmployeeRequest[]): number | null => {
  const approvedVacations = requests.filter(r => r.type === 'Vacation' && r.status === 'Approved' && r.isSigned);
  if (approvedVacations.length === 0) return null;

  const dates = approvedVacations.map(r => parseLocalDate(r.data.endDate).getTime());
  const lastEndDate = new Date(Math.max(...dates));
  const now = new Date();
  
  // Set to midnight to avoid precision issues
  lastEndDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - lastEndDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
