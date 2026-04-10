export type PostLanguage = {
    code: 'en' | 'zh' | 'bm' | string;
    name: string;
} | null;

export type PostUser = {
    name: string;
} | null;

export type PostItem = {
    id: number;
    title: string;
    content: string;
    image: string[] | null;
    created_at: string;
    language?: PostLanguage;
    user?: PostUser;
    likes_count?: number;
    comments_count?: number;
};
