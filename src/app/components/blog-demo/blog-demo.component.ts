import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BlogStore,
  provideBlogStore,
  sampleBlogData,
} from '../../store/blog.store';
import { User, Comment } from '../../models';

@Component({
  selector: 'app-blog-demo',
  imports: [CommonModule],
  providers: [provideBlogStore()],
  template: `
    <div class="container">
      <h1>NgRx Signal Store Normalization Demo</h1>

      <div class="section">
        <h2>Normalized Data</h2>
        <div class="data-section">
          <div class="data-column">
            <h3>Users</h3>
            <pre>{{ usersJson }}</pre>
          </div>
          <div class="data-column">
            <h3>Comments</h3>
            <pre>{{ commentsJson }}</pre>
          </div>
          <div class="data-column">
            <h3>Posts</h3>
            <pre>{{ postsJson }}</pre>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Denormalized Posts</h2>
        <pre>{{ denormalizedPostsJson }}</pre>
      </div>

      <div class="section">
        <h2>Actions</h2>
        <div class="actions">
          <button (click)="addNewUser()">Add New User</button>
          <button (click)="addNewComment()">Add New Comment</button>
          <button (click)="updateUser()">Update User</button>
          <button (click)="removeComment()">Remove Comment</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      .section {
        margin-bottom: 30px;
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 5px;
      }

      .data-section {
        display: flex;
        gap: 20px;
      }

      .data-column {
        flex: 1;
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 5px;
      }

      pre {
        white-space: pre-wrap;
        font-size: 12px;
        overflow: auto;
        max-height: 300px;
      }

      .actions {
        display: flex;
        gap: 10px;
      }

      button {
        padding: 8px 16px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      button:hover {
        background-color: #3367d6;
      }
    `,
  ],
})
export class BlogDemoComponent implements OnInit {
  private store = inject(BlogStore);

  // Computed properties for display
  get usersJson(): string {
    return JSON.stringify(this.store.usersEntities(), null, 2);
  }

  get commentsJson(): string {
    return JSON.stringify(this.store.commentsEntities(), null, 2);
  }

  get postsJson(): string {
    return JSON.stringify(this.store.postsEntities(), null, 2);
  }

  get denormalizedPostsJson(): string {
    return JSON.stringify(this.store.denormalizedPosts(), null, 2);
  }

  ngOnInit(): void {
    // Load sample data when component initializes
    this.store.loadBlogData(sampleBlogData);
  }

  // Action methods
  addNewUser(): void {
    const newUser: User = {
      username: 'user4',
      name: 'User 4',
    };

    this.store.addUser(newUser);
  }

  addNewComment(): void {
    // Get the first post to add a comment to
    const posts = this.store.postsEntities();
    if (posts.length === 0) return;

    const postId = posts[0].id;

    const newComment: Comment = {
      id: `comment${Date.now()}`, // Generate a unique ID
      author: 'user4', // Reference the new user we added
      comment: 'This is a new comment added through the UI!',
    };

    this.store.addComment(newComment, postId);
  }

  updateUser(): void {
    // Update the first user's name
    const users = this.store.usersEntities();
    if (users.length === 0) return;

    const username = users[0].username;

    this.store.updateUser(username, {
      name: `${users[0].name} (Updated)`,
    });
  }

  removeComment(): void {
    // Remove the first comment
    const comments = this.store.commentsEntities();
    if (comments.length === 0) return;

    const commentId = comments[0].id;

    this.store.removeComment(commentId);
  }
}
