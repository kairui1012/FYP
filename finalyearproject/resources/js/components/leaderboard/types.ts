export type Period = 'all_time' | 'weekly' | 'monthly';

export type LeaderboardUser = {
    id: number;
    name: string;
    avatar: string | null;
    points: number;
    rank: number;
    is_anonymous: boolean;
    role?: string | null;
    is_verified?: boolean;
    leaderboard_title?: string | null;
};

export type CurrentUserRank = {
    rank: number | null;
    points: number;
    pointsToNext: number | null;
    isAnonymous: boolean;
    showLeaderboardBadge: boolean;
};

export type PointsHistoryEntry = {
    points: number;
    action: string;
    created_at: string;
};

export type PaginatedRows = {
    data: LeaderboardUser[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    from: number | null;
    to: number | null;
    total: number;
};

export type LeaderboardPayload = {
    activePeriod: Period;
    periods: Period[];
    podium: LeaderboardUser[];
    rows: PaginatedRows;
    currentUser: CurrentUserRank | null;
    pointsHistory: PointsHistoryEntry[];
};
