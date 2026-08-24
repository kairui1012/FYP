export type User = {
    id: number;
    name: string;
    email: string;
    role?: 'admin' | 'teacher' | 'student' | string;
    avatar?: string;
    leaderboard_title?: string | null;
    show_leaderboard_badge?: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
