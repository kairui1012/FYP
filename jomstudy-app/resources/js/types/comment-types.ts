type CommentMention = {
    id: number;
    name: string;
    handle: string;
    avatar?: string | null;
};

type CommentUser = {
    id: number;
    name: string;
    avatar?: string | null;
    leaderboard_title?: string | null;
    role?: string;
    is_verified?: boolean;
} | null;

type CommentReplyUser = {
    id: number;
    name: string;
    avatar?: string | null;
    leaderboard_title?: string | null;
} | null;

export type CommentItem = {
    id: number;
    parent_id?: number | null;
    depth?: number;
    content: string;
    attachments?: string[] | null;
    mentions?: CommentMention[] | null;
    created_at: string;
    likes_count?: number;
    upvotes_count?: number;
    downvotes_count?: number;
    wrong_votes_count?: number;
    score?: number;
    user_vote?: number;
    is_upvoted?: boolean;
    is_downvoted?: boolean;
    is_wrong?: boolean;
    is_liked?: boolean;
    reply_to_user?: CommentReplyUser;
    replies?: CommentItem[];
    user?: CommentUser;
};
