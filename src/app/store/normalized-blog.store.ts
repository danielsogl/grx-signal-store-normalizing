import { signalStore, withMethods } from '@ngrx/signals';
import type { Comment, Post, User } from '../models';
import {
  createEntitySchema,
  hasMany,
  hasOne,
  withNormalization,
} from './features/normalization';

// Define the schemas for our entities using the utility functions
const schemas = {
  users: createEntitySchema<User>('username'),

  comments: createEntitySchema<Comment>('id', {
    author: hasOne('users'),
  }),

  posts: createEntitySchema<Post>('id', {
    author: hasOne('users'),
    comments: hasMany('comments'),
  }),
};

// Sample blog data (nested structure)
export const sampleBlogData = [
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

// Create the normalized blog store
export const NormalizedBlogStore = signalStore(
  // Use the normalization feature with our schemas
  withNormalization(schemas),

  // Add methods specific to our blog application
  withMethods((store) => ({
    // Load the sample blog data
    loadSampleData(): void {
      store.addNormalizedData(sampleBlogData, 'posts');
    },

    // Add a new comment to a post
    addComment(postId: string, comment: Omit<Comment, 'id'>): void {
      // Generate a unique ID for the comment
      const commentId = `comment${Date.now()}`;

      // Create the full comment object
      const newComment: Comment = {
        ...comment,
        id: commentId,
      };

      // Add the comment to the store
      store.addNormalizedData(newComment, 'comments');

      // Get the post
      const post = store.getEntityById<Post>('posts', postId);
      if (post) {
        // Update the post to include the new comment
        const result = store.updateEntity<Post>('posts', postId, {
          comments: [...post.comments, commentId],
        });

        if (!result.success) {
          console.error(
            `Failed to update post with new comment: ${result.error}`
          );
        }
      }
    },

    // Update a user's name
    updateUserName(username: string, name: string): void {
      const result = store.updateEntity<User>('users', username, { name });
      if (!result.success) {
        console.error(`Failed to update user: ${result.error}`);
      }
    },

    // Remove a comment
    removeComment(commentId: string): void {
      // Get all posts using the new selector
      const postsSignal = store.selectDenormalized<Post>('posts');

      // Find posts that reference this comment
      postsSignal().forEach((post: Post) => {
        if (post.comments.includes(commentId)) {
          // Update the post to remove the comment reference
          const result = store.updateEntity<Post>('posts', post.id, {
            comments: post.comments.filter((id: string) => id !== commentId),
          });

          if (!result.success) {
            console.error(
              `Failed to remove comment reference from post: ${result.error}`
            );
          }
        }
      });

      // Remove the comment
      store.removeEntity('comments', commentId);
    },
  }))
);

// Create a provider for the normalized blog store
export function provideNormalizedBlogStore() {
  return NormalizedBlogStore;
}
