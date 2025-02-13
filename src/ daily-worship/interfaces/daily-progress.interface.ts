// interfaces/progress.interface.ts

export interface DailyProgressDetail {
  date: Date;
  selawat: number;
  istigfar: number;
  quran: {
    minutes: number;
  };
}

interface ProgressTotals {
  selawat: number;
  istigfar: number;
  quran: {
    minutes: number;
  };
}

// Base progress interface with common properties
interface BaseProgress {
  dailyProgress: DailyProgressDetail[];
  totals: ProgressTotals;
}

// Weekly progress remains unchanged
export interface WeeklyProgress extends BaseProgress {}

// Monthly progress adds metadata
export interface MonthlyProgress extends BaseProgress {
  metadata: {
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
  };
}