import type { User, Comment, Post } from '../../../models';
import { normalize } from './normalizer';
import { createEntitySchema, EntitySchemaMap, hasMany, hasOne } from './schema';

// Define types for the nested blog data structure
export interface NestedAuthor {
  username: string;
  name: string;
}

export interface NestedComment {
  id: string;
  author: NestedAuthor;
  comment: string;
}

export interface NestedPost {
  id: string;
  author: NestedAuthor;
  body: string;
  comments: NestedComment[];
}

// Sample blog data (nested structure)
export const sampleBlogData: NestedPost[] = [
  {
    id: 'post1',
    author: { username: 'user1', name: 'User 1' },
    body: 'This is the first post content.',
    comments: [
      {
        id: 'comment1',
        author: { username: 'user2', name: 'User 2' },
        comment: 'Great post!',
      },
      {
        id: 'comment2',
        author: { username: 'user3', name: 'User 3' },
        comment: 'I learned a lot from this.',
      },
    ],
  },
  {
    id: 'post2',
    author: { username: 'user2', name: 'User 2' },
    body: 'This is the second post content.',
    comments: [
      {
        id: 'comment3',
        author: { username: 'user3', name: 'User 3' },
        comment: 'Interesting perspective!',
      },
      {
        id: 'comment4',
        author: { username: 'user1', name: 'User 1' },
        comment: 'I disagree with some points.',
      },
      {
        id: 'comment5',
        author: { username: 'user3', name: 'User 3' },
        comment: 'Could you elaborate more?',
      },
    ],
  },
];

/**
 * Normalizes nested blog data into separate collections of users, comments, and posts.
 * This transforms deeply nested data into a flat structure with references by ID.
 *
 * @param blogPosts Array of nested blog posts
 * @returns Object containing normalized users, comments, and posts arrays
 */
export function normalizeBlogData(blogPosts: NestedPost[]): {
  users: User[];
  comments: Comment[];
  posts: Post[];
} {
  // Define schemas for each entity type
  const schemaMap: EntitySchemaMap = {
    users: createEntitySchema<User>('username'),
    comments: createEntitySchema<Comment>('id', {
      author: hasOne('users')
    }),
    posts: createEntitySchema<Post>('id', {
      author: hasOne('users'),
      comments: hasMany('comments')
    })
  };

  // Transform nested data to match expected format
  const transformedData = blogPosts.map(post => {
    // Transform comments to match Comment model
    const transformedComments = post.comments.map(comment => ({
      id: comment.id,
      author: comment.author.username,
      comment: comment.comment
    }));

    // Transform post to match Post model
    return {
      id: post.id,
      author: post.author.username,
      body: post.body,
      comments: transformedComments
    };
  });

  // Normalize the data
  const normalizedData = normalize(transformedData, 'posts', schemaMap);

  // Extract the normalized entities
  const entities = normalizedData.entities;

  // Convert entities to arrays for the return format
  return {
    users: Object.values(entities['users'] || {}) as User[],
    comments: Object.values(entities['comments'] || {}) as Comment[],
    posts: Object.values(entities['posts'] || {}) as Post[],
  };
}
