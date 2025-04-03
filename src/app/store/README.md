# NgRx Signal Store Data Normalization

This utility provides generic data normalization functionality specifically designed to work well with NgRx Signal Store.

## Usage

The normalization utilities help transform nested data structures into a flat, normalized format that's more efficient for state management.

### Basic Example

```typescript
import { normalize } from './features/normalization/normalizer';
import { createEntitySchema, hasOne, hasMany } from './features/normalization/schema';

// Define your schemas
const schemaMap = {
  users: createEntitySchema<User>('username'), // Use username as the ID instead of the default 'id'
  comments: createEntitySchema<Comment>('id', {
    author: hasOne('users')
  }),
  posts: createEntitySchema<Post>('id', {
    author: hasOne('users'),
    comments: hasMany('comments')
  })
};

// Example data with nested structure
const data = [
  {
    id: '1',
    title: 'My first post',
    author: 'user1',
    comments: [
      {
        id: 'c1',
        author: 'user2', 
        text: 'Great post!'
      }
    ]
  }
];

// Normalize the data
const normalizedData = normalize(data, 'posts', schemaMap);

// The result will be a flat structure with references:
// {
//   entities: {
//     users: {
//       'user1': { username: 'user1', name: 'User One' },
//       'user2': { username: 'user2', name: 'User Two' }
//     },
//     comments: {
//       'c1': { id: 'c1', author: 'user2', text: 'Great post!' }
//     },
//     posts: {
//       '1': { id: '1', title: 'My first post', author: 'user1', comments: ['c1'] }
//     }
//   },
//   result: ['1']
// }
```

### Using with NgRx Signal Store

Normalized data works well with NgRx Signal Store by breaking complex state into manageable pieces:

```typescript
import { patchState, signalStore, withState } from '@ngrx/signals';
import { normalize } from './features/normalization/normalizer';
import { createEntitySchema, hasOne, hasMany } from './features/normalization/schema';

// Define initial state with normalized structure
const initialState = {
  users: {},
  posts: {},
  comments: {},
  loading: false,
  error: null
};

// Define schemas
const schemaMap = {
  users: createEntitySchema<User>(),
  comments: createEntitySchema<Comment>('id', {
    author: hasOne('users')
  }),
  posts: createEntitySchema<Post>('id', {
    author: hasOne('users'),
    comments: hasMany('comments')
  })
};

export const BlogStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    // Method to load and normalize blog data
    loadBlogData(data) {
      // Set loading state
      patchState(store, { loading: true });
      
      try {
        // Normalize the data
        const normalizedData = normalize(data, 'posts', schemaMap);
        
        // Update store with normalized entities
        patchState(store, {
          users: normalizedData.entities.users || {},
          posts: normalizedData.entities.posts || {},
          comments: normalizedData.entities.comments || {},
          loading: false
        });
      } catch (error) {
        patchState(store, { error, loading: false });
      }
    }
  }))
);
```

## Benefits of Normalization

1. **Eliminates data duplication** - Each entity is stored only once
2. **Easier updates** - No need to find and update nested objects
3. **Better performance** - Lookups and updates are faster with flat data
4. **Simplified relationships** - References by ID instead of nested objects
5. **Consistent structure** - Predictable state shape for your application 