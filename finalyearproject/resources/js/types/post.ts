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
    leaderboard_title?: string | null;
} | null;

export type CommentReplyUser = {
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

export type MentionableUser = {
    id: number;
    name: string;
    handle: string;
    avatar?: string | null;
};

export type PostUser = {
    id: number;
    name: string;
    role?: 'admin' | 'teacher' | 'student' | string;
    avatar?: string | null;
    leaderboard_title?: string | null;
    is_following?: boolean;
} | null;

export type MaterialFeedbackUser = {
    id?: number | null;
    name: string;
    role?: 'admin' | 'teacher' | 'student' | string;
    avatar?: string | null;
} | null;

export type MaterialFeedbackEntry = {
    id: number;
    feedback: string;
    rating?: number | null;
    vote?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    is_owner?: boolean;
    recommend_count: number;
    not_recommend_count: number;
    user?: MaterialFeedbackUser;
};

export type QuizData = {
    options: [string, string, string, string] | string[];
    answer_index: number;
    questions?: {
        question: string | null;
        options: string[];
        answer_index: number;
        explanation?: string | null;
    }[];
} | null;

export type MaterialContentBlock =
    | {
          type: 'text';
          text: string;
      }
    | {
          type: 'image' | 'document';
          path: string;
          name?: string | null;
          mime?: string | null;
      }
    | {
          type: 'video';
          url: string;
      };

export type PostItem = {
    id: number;
    title: string;
    content: string;
    content_blocks?: MaterialContentBlock[] | null;
    post_type: 'material' | 'question' | 'discussion' | 'quiz' | string;
    quiz_data?: QuizData;
    parent_material_id?: number | null;
    material_improved_from_feedback?: boolean;
    subject?: PostSubject;
    image: string[] | null;
    video_url?: string | null;
    created_at: string;
    updated_at?: string;
    saved_at?: string | null;
    bookmark_folder_id?: number | null;
    bookmark_item_id?: number | null;
    is_anonymous?: boolean;
    language?: PostLanguage;
    user?: PostUser;
    is_quiz_completed?: boolean;
    quiz_attempts?: Array<{
        question_index: number;
        selected_answer_index: number;
        is_correct: boolean;
    }>;
    material_learning_state?:
        | 'unread'
        | 'in_progress'
        | 'read'
        | 'completed'
        | string
        | null;
    material_learning_path?: Array<{
        key: 'read_material' | 'complete_quiz' | 'submit_feedback' | string;
        status:
            | 'pending'
            | 'in_progress'
            | 'completed'
            | 'not_required'
            | string;
        required: boolean;
    }>;
    likes_count?: number;
    comments_count?: number;
    saves_count?: number;
    is_liked?: boolean;
    is_saved?: boolean;
    material_feedback_summary?: {
        average_rating: number;
        rating_count: number;
        upvotes: number;
        downvotes: number;
        recommended_count: number;
        not_recommended_count: number;
        total_votes: number;
        recommendation_rate: number;
        feedback_count: number;
        latest_feedback: MaterialFeedbackEntry[];
    } | null;
    material_version_history?: Array<{
        id: number;
        version_number: number;
        title: string;
        average_rating: number;
        rating_count: number;
        recommended_count: number;
        total_votes: number;
        recommendation_rate: number;
        created_at?: string | null;
    }> | null;
    material_user_feedback?: {
        id?: number;
        vote?: number | null;
        rating?: number | null;
        feedback?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
    } | null;
    learning_analytics?: {
        views: number;
        unique_users: number;
        quiz_attempts: number;
        average_quiz_score: number;
        improvement_across_attempts: number;
        average_rating: number;
        feedback_count: number;
    } | null;
    linked_quizzes?: PostItem[];
    comments?: CommentItem[] | null;
};

export type BookmarkFolderItem = {
    id: number;
    name: string;
    is_default: boolean;
    items_count: number;
};
