import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  withEntities,
  setAllEntities,
  addEntity,
  updateEntity,
  removeEntity,
  upsertEntity,
} from '@ngrx/signals/entities';
import { User, Comment, Post } from '../models';
import { userConfig, commentConfig, postConfig } from './entity-adapters';
import { 
  normalizeBlogData, 
  NestedPost 
} from './utils/normalization.utils';

// Re-export the sample data for use in components
export { sampleBlogData } from './utils/normalization.utils';

/**
 * Interface for a denormalized comment with the author object included
 */
interface DenormalizedComment extends Omit<Comment, 'author'> {
  author: User | undefined;
}

/**
 * Interface for a denormalized post with author and comments objects included
 */
interface DenormalizedPost extends Omit<Post, 'author' | 'comments'> {
  author: User | undefined;
  comments: DenormalizedComment[];
}

// Create the blog store
export const BlogStore = signalStore(
  // Set up the entity collections
  withEntities(userConfig),
  withEntities(commentConfig),
  withEntities(postConfig),

  // Add state for loading indicators
  withState({
    usersLoading: false,
    commentsLoading: false,
    postsLoading: false,
  }),

  // Add computed properties
  withComputed((store) => {
    // Helper functions for finding entities
    const findUserByUsername = (username: string): User | undefined => {
      return store.usersEntities().find((user) => user.username === username);
    };

    const findCommentById = (commentId: string): Comment | undefined => {
      return store.commentsEntities().find((comment) => comment.id === commentId);
    };

    const findPostById = (postId: string | number): Post | undefined => {
      return store.postsEntities().find((post) => post.id === postId);
    };

    // Helper function to create a denormalized comment
    const getDenormalizedComment = (commentId: string): DenormalizedComment | undefined => {
      const comment = findCommentById(commentId);
      if (!comment) return undefined;
      
      return {
        ...comment,
        author: findUserByUsername(comment.author)
      };
    };

    return {
      // Get a denormalized view of posts with author and comments
      denormalizedPosts: computed(() => {
        return store.postsIds()
          .map(postId => {
            const post = findPostById(postId);
            if (!post) return null;
            
            // Get the author for this post
            const author = findUserByUsername(post.author);
            
            // Get denormalized comments for this post
            const comments = post.comments
              .map(commentId => getDenormalizedComment(commentId))
              .filter((comment): comment is DenormalizedComment => comment !== undefined);
            
            // Return the denormalized post
            return {
              ...post,
              author,
              comments
            };
          })
          .filter((post): post is DenormalizedPost => post !== null);
      }),
      
      // Loading state
      isLoading: computed(
        () =>
          store.usersLoading() || store.commentsLoading() || store.postsLoading()
      ),
    };
  }),

  // Add methods to update the store
  withMethods((store) => ({
    // Load normalized blog data
    loadBlogData(blogData: NestedPost[]) {
      // Set loading state
      patchState(store, {
        usersLoading: true,
        commentsLoading: true,
        postsLoading: true,
      });

      // Normalize the data
      const { users, comments, posts } = normalizeBlogData(blogData);

      // Update the store with normalized data
      patchState(store, setAllEntities(users, userConfig));
      patchState(store, setAllEntities(comments, commentConfig));
      patchState(store, setAllEntities(posts, postConfig));

      // Reset loading state
      patchState(store, {
        usersLoading: false,
        commentsLoading: false,
        postsLoading: false,
      });
    },

    // Add a new user
    addUser(user: User) {
      patchState(store, addEntity(user, userConfig));
    },

    // Add a new comment
    addComment(comment: Comment, postId: string) {
      // Add the comment
      patchState(store, addEntity(comment, commentConfig));

      // Update the post to include the new comment
      const post = store.postsEntities().find((p) => p.id === postId);
      if (post) {
        patchState(
          store,
          updateEntity(
            {
              id: postId,
              changes: {
                comments: [...post.comments, comment.id],
              },
            },
            postConfig
          )
        );
      }
    },

    // Add a new post
    addPost(post: Post) {
      patchState(store, addEntity(post, postConfig));
    },

    // Update a user
    updateUser(username: string, changes: Partial<User>) {
      patchState(
        store,
        updateEntity(
          {
            id: username,
            changes,
          },
          userConfig
        )
      );
    },

    // Update a comment
    updateComment(commentId: string, changes: Partial<Comment>) {
      patchState(
        store,
        updateEntity(
          {
            id: commentId,
            changes,
          },
          commentConfig
        )
      );
    },

    // Update a post
    updatePost(postId: string, changes: Partial<Post>) {
      patchState(
        store,
        updateEntity(
          {
            id: postId,
            changes,
          },
          postConfig
        )
      );
    },

    // Remove a user
    removeUser(username: string) {
      patchState(store, removeEntity(username, userConfig));
    },

    // Remove a comment
    removeComment(commentId: string) {
      // Get the comment to be removed
      const comment = store.commentsEntities().find((c) => c.id === commentId);
      if (!comment) return;

      // Remove the comment
      patchState(store, removeEntity(commentId, commentConfig));

      // Update any posts that reference this comment
      store.postsEntities().forEach((post) => {
        if (post.comments.includes(commentId)) {
          patchState(
            store,
            updateEntity(
              {
                id: post.id,
                changes: {
                  comments: post.comments.filter((id) => id !== commentId),
                },
              },
              postConfig
            )
          );
        }
      });
    },

    // Remove a post
    removePost(postId: string) {
      patchState(store, removeEntity(postId, postConfig));
    },

    // Upsert a user (add if not exists, update if exists)
    upsertUser(user: User) {
      patchState(store, upsertEntity(user, userConfig));
    },
  }))
);

// Create a provider for the blog store
export function provideBlogStore() {
  return BlogStore;
}
