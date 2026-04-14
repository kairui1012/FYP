export type PostLanguage = {
    code: 'en' | 'zh' | 'bm' | string;
    name: string;
} | null;

export type PostSubject = {
    id: number;
    name: string;
} | null;

export type CommentMention = {
    id: number;
    name: string;
    handle: string;
    avatar?: string | null;
};

export type CommentUser = {
    id: number;
    name: string;
    avatar?: string | null;
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
    is_liked?: boolean;
    replies?: CommentItem[];
    user?: CommentUser;
};

export type MentionableUser = {
    id: number;
    name: string;
    handle: string;
    avatar?: string | null;
};

export type PostUser = {
    id: number;
    name: string;
    avatar?: string | null;
    is_following?: boolean;
} | null;

export type PostItem = {
    id: number;
    title: string;
    content: string;
    post_type: 'material' | 'question' | string;
    subject?: PostSubject;
    image: string[] | null;
    created_at: string;
    language?: PostLanguage;
    user?: PostUser;
    likes_count?: number;
    comments_count?: number;
    saves_count?: number;
    is_liked?: boolean;
    is_saved?: boolean;
    comments?: CommentItem[] | null;
};
