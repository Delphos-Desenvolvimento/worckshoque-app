export type UserRole = 'admin' | 'doctor' | 'patient' | 'master';

export interface Content {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'infographic' | 'document' | 'link';
  category: string;
  content?: string;
  metadata: {
    duration?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    questions?: Array<{
      id: string;
      question: string;
      type: 'text' | 'multiple_choice' | 'scale';
      options?: string[];
      required: boolean;
    }>;
  };
  accessLevel?: 'public' | 'restricted' | 'private';
  allowedRoles?: UserRole[];
  specialtyRestrictions?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  downloads?: number;
  isFavorite?: boolean;
  progress?: number;
  lastViewed?: string;
  url?: string;
  filePath?: string;
  thumbnailUrl?: string;
}
