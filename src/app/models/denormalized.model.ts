import { Comment, Post, User } from './';

/**
 * Interface for a denormalized comment with author object
 */
export interface DenormalizedComment extends Omit<Comment, 'author'> {
  author: User;
}

/**
 * Interface for a denormalized post with author and comments objects
 */
export interface DenormalizedPost extends Omit<Post, 'author' | 'comments'> {
  id: string;
  author: User;
  body: string;
  comments: DenormalizedComment[];
} 