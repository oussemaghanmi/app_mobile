export type ReportReason = 'medical_misinformation' | 'harassment' | 'spam' | 'personal_data' | 'other';
export const REPORT_REASONS: ReportReason[] = [
  'medical_misinformation',
  'harassment',
  'spam',
  'personal_data',
  'other',
];

export interface Post {
  id: string;
  author_id: string;
  content: string;
  hidden: boolean;
  created_at: string;
  author: { pseudonym: string } | null;
  community_comments: { count: number }[];
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  hidden: boolean;
  created_at: string;
  author: { pseudonym: string } | null;
}

export type ReportTarget = { postId: string } | { commentId: string };
