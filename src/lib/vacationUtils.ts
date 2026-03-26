import { EmployeeRequest } from '@/types';

/**
 * Calculates the number of days between two dates inclusive.
 * Assumes dates are in YYYY-MM-DD format.
 */
export const getDurationInDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to midnight to avoid DST issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Calculates total accrued vacation days since hire date (15 days per completed year).
 */
export const getAccruedDays = (hireDate: string, currentDate: string = new Date().toISOString().split('T')[0]): number => {
  const hire = new Date(hireDate);
  const current = new Date(currentDate);
  
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
export const getVacationHistory = (hireDate: string, requests: EmployeeRequest[], yearlyDocs: any[] = []): VacationYearBreakdown[] => {
  const hire = new Date(hireDate);
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
    const startStr = periodStart.toISOString().split('T')[0];
    const endStr = periodEnd.toISOString().split('T')[0];
    
    // Find requests that fall within this year
    const yearRequests = approvedVacations.filter(r => {
      const reqStart = new Date(r.data.startDate);
      return reqStart >= periodStart && reqStart <= periodEnd;
    });

    // Check for a signed yearly summary for this specific year
    const yearlyDoc = yearlyDocs.find(doc => 
      doc.is_signed && 
      doc.request_id && doc.request_id.endsWith(`:${yearNum}`)
    );

    const takenFromRequests = yearRequests.reduce((sum, r) => sum + getDurationInDays(r.data.startDate, r.data.endDate), 0);
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
export const calculateVacationBalance = (hireDate: string, requests: EmployeeRequest[], yearlyDocs: any[] = []) => {
  const accrued = getAccruedDays(hireDate);
  const approvedVacations = requests.filter(r => r.type === 'Vacation' && r.status === 'Approved' && r.isSigned);
  const takenFromRequests = approvedVacations.reduce((sum, r) => sum + getDurationInDays(r.data.startDate, r.data.endDate), 0);
  
  // Also count manually entered days from signed yearly summaries
  const takenFromYearly = yearlyDocs
    .filter(doc => doc.is_signed && doc.data && doc.data.manualDays)
    .reduce((sum, doc) => sum + (doc.data.manualDays || 0), 0);

  const taken = takenFromRequests + takenFromYearly;
  
  return {
    accrued,
    taken,
    balance: accrued - taken
  };
};

/**
 * Calculates days since the end of the most recent approved vacation.
 * Returns null if no vacations have been taken.
 */
export const getDaysSinceLastVacation = (requests: EmployeeRequest[]): number | null => {
  const approvedVacations = requests.filter(r => r.type === 'Vacation' && r.status === 'Approved' && r.isSigned);
  if (approvedVacations.length === 0) return null;

  const dates = approvedVacations.map(r => new Date(r.data.endDate).getTime());
  const lastEndDate = new Date(Math.max(...dates));
  const now = new Date();
  
  // Set to midnight to avoid precision issues
  lastEndDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - lastEndDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
