// interfaces/leaderboard.interface.ts

export interface LeaderboardTotals {
    selawat: number;
    istigfar: number;
    quranMinutes: number;
    totalParticipants: number;
  }
  
  export interface UserStats {
    selawat: number;
    istigfar: number;
    quranMinutes: number;
  }
  
  export interface UserRank {
    rank: number;
    userId: string;
    stats: UserStats;
  }
  
  export interface LeaderboardUser {
    rank: number;
    userId: string;
    selawat: number;
    istigfar: number;
    quranMinutes: number;
  }
  
  export interface LeaderboardResponse {
    totals: LeaderboardTotals;
    userRank: UserRank | null;
    topUsers: LeaderboardUser[];
  }