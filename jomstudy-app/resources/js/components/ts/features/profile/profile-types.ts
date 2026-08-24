export type Badge = {
    id: number;
    key: string;
    name: string;
    description: string;
    icon?: string | null;
    points_required: number;
    awarded_at?: string | null;
};

export type ProfileUser = {
    id: number;
    name: string;
    email?: string | null;
    role?: string;
    is_verified?: boolean;
    avatar?: string | null;
    about?: string | null;
    leaderboard_title?: string | null;
    is_following?: boolean;
    points?: number;
    badges?: Badge[];
    featured_badge_ids?: number[];
    followers_count?: number;
    following_count?: number;
};

export type ProfilePost = {
    id: number;
    title: string;
    content: string;
    image?: string[] | null;
    created_at: string;
    likes_count?: number;
    comments_count?: number;
    language?: { code: string; name: string } | null;
};

export type PageProps = {
    profileUser: ProfileUser;
    posts: ProfilePost[];
};

export type TransFn = (key: string) => string;
