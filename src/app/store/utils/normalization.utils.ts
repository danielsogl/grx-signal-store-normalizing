import { User, Comment, Post } from '../../models';

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
        comment: 'Great post!'
      },
      {
        id: 'comment2',
        author: { username: 'user3', name: 'User 3' },
        comment: 'I learned a lot from this.'
      }
    ]
  },
  {
    id: 'post2',
    author: { username: 'user2', name: 'User 2' },
    body: 'This is the second post content.',
    comments: [
      {
        id: 'comment3',
        author: { username: 'user3', name: 'User 3' },
        comment: 'Interesting perspective!'
      },
      {
        id: 'comment4',
        author: { username: 'user1', name: 'User 1' },
        comment: 'I disagree with some points.'
      },
      {
        id: 'comment5',
        author: { username: 'user3', name: 'User 3' },
        comment: 'Could you elaborate more?'
      }
    ]
  }
];

/**
 * Normalizes nested blog data into separate collections of users, comments, and posts.
 * This transforms deeply nested data into a flat structure with references by ID.
 * 
 * @param blogPosts Array of nested blog posts
 * @returns Object containing normalized users, comments, and posts arrays
 */
export function normalizeBlogData(blogPosts: NestedPost[]) {
  const users: Record<string, User> = {};
  const comments: Record<string, Comment> = {};
  const posts: Record<string, Post> = {};

  // Extract users, comments, and posts
  blogPosts.forEach(post => {
    // Add author if not already added
    if (!users[post.author.username]) {
      users[post.author.username] = {
        username: post.author.username,
        name: post.author.name
      };
    }

    // Process comments
    const commentIds: string[] = [];
    post.comments.forEach((comment) => {
      // Add comment author if not already added
      if (!users[comment.author.username]) {
        users[comment.author.username] = {
          username: comment.author.username,
          name: comment.author.name
        };
      }

      // Add comment
      comments[comment.id] = {
        id: comment.id,
        author: comment.author.username,
        comment: comment.comment
      };

      commentIds.push(comment.id);
    });

    // Add post
    posts[post.id] = {
      id: post.id,
      author: post.author.username,
      body: post.body,
      comments: commentIds
    };
  });

  return {
    users: Object.values(users),
    comments: Object.values(comments),
    posts: Object.values(posts)
  };
}
