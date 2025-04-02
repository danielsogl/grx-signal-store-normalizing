import { type } from '@ngrx/signals';
import { entityConfig } from '@ngrx/signals/entities';
import { User, Comment, Post } from '../models';

// Entity configurations
export const userConfig = entityConfig({
  entity: type<User>(),
  collection: 'users',
  selectId: (user: User) => user.username,
});

export const commentConfig = entityConfig({
  entity: type<Comment>(),
  collection: 'comments',
  selectId: (comment: Comment) => comment.id,
});

export const postConfig = entityConfig({
  entity: type<Post>(),
  collection: 'posts',
  selectId: (post: Post) => post.id,
});
