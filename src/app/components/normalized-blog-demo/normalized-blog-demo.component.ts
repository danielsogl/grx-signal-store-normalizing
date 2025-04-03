import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Comment, Post, User, DenormalizedPost, DenormalizedComment } from '../../models';
import { NormalizedBlogStore } from '../../store/normalized-blog.store';

@Component({
  selector: 'app-normalized-blog-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [NormalizedBlogStore],
  template: `
    <div class="container">
      <h1>NgRx Signal Store Normalization Demo</h1>

      <div class="section">
        <h2>Normalized Data Structure</h2>
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
          <button (click)="updateUserName()">Update User Name</button>
          <button (click)="addNewComment()">Add New Comment</button>
          <button (click)="removeComment()">Remove Comment</button>
        </div>
      </div>

      <div class="section" *ngIf="selectedPost">
        <h2>Add Comment to "{{ selectedPost.body }}"</h2>
        <div class="form-group">
          <label for="author">Author:</label>
          <select id="author" [(ngModel)]="newComment.author">
            <option *ngFor="let user of users" [value]="user.username">
              {{ user.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="comment">Comment:</label>
          <textarea
            id="comment"
            [(ngModel)]="newComment.comment"
            rows="3"
          ></textarea>
        </div>
        <button (click)="submitComment()">Submit Comment</button>
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
        margin-bottom: 20px;
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

      .form-group {
        margin-bottom: 15px;
      }

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }

      select,
      textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
    `,
  ],
})
export class NormalizedBlogDemoComponent implements OnInit {
  private store = inject(NormalizedBlogStore);

  // Selected post for adding comments
  selectedPost: DenormalizedPost | null = null;

  // New comment form data
  newComment: Omit<Comment, 'id'> = {
    author: '',
    comment: '',
  };

  // Computed properties for display
  get usersJson(): string {
    return JSON.stringify(this.store['usersEntityMap']?.(), null, 2);
  }

  get commentsJson(): string {
    return JSON.stringify(this.store['commentsEntityMap']?.(), null, 2);
  }

  get postsJson(): string {
    return JSON.stringify(this.store['postsEntityMap']?.(), null, 2);
  }

  get denormalizedPostsJson(): string {
    return JSON.stringify(this.store['getAllPosts'](), null, 2);
  }

  get users(): User[] {
    return this.store['getAllUsers']();
  }

  get posts(): DenormalizedPost[] {
    return this.store['getAllPosts']();
  }

  get comments(): DenormalizedComment[] {
    return this.store['getAllComments']();
  }

  ngOnInit(): void {
    // Load sample data when component initializes
    this.store.loadSampleData();

    // Set the first post as the selected post
    setTimeout(() => {
      const posts = this.posts;
      if (posts.length > 0) {
        this.selectedPost = posts[0];

        // Set default author if users exist
        const users = this.users;
        if (users.length > 0) {
          this.newComment.author = users[0].username;
        }
      }
    }, 100);
  }

  // Action methods
  updateUserName(): void {
    const users = this.users;
    if (users.length === 0) return;

    // Update the first user's name
    const user = users[0];
    this.store.updateUserName(user.username, `${user.name} (Updated)`);
  }

  addNewComment(): void {
    if (!this.selectedPost) return;

    // Create a new comment
    const comment: Omit<Comment, 'id'> = {
      author: this.users[0].username,
      comment: 'This is a new comment added through the UI!',
    };

    // Add the comment to the selected post
    this.store.addComment(this.selectedPost.id, comment);
  }

  removeComment(): void {
    const comments = this.comments;
    if (comments.length === 0) return;

    // Remove the first comment
    this.store.removeComment(comments[0].id);
  }

  submitComment(): void {
    if (
      !this.selectedPost ||
      !this.newComment.author ||
      !this.newComment.comment
    )
      return;

    // Add the comment to the selected post
    this.store.addComment(this.selectedPost.id, this.newComment);

    // Reset the form
    this.newComment = {
      author: this.users[0]?.username || '',
      comment: '',
    };
  }
}
