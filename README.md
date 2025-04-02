# NgRx Signal Store Normalization Demo

This project demonstrates how to use NgRx Signal Store with entity adapters to normalize nested data for better performance and state management.

## Overview

The demo shows how to:

1. Define entity models with relationships
2. Create entity configurations with custom ID selectors
3. Set up a signal store with entity collections
4. Normalize nested data into separate entity collections
5. Perform CRUD operations on normalized entities
6. Create denormalized views of the data when needed for the UI

## Project Structure

- **Models**: Define the shape of our entities (User, Comment, Post)
- **Entity Adapters**: Configure how entities are identified and stored
- **Blog Store**: Implements the signal store with entity collections and operations
- **Blog Demo Component**: UI to visualize and interact with the normalized data

## Normalization Benefits

Normalizing data in the store provides several benefits:

1. **Single Source of Truth**: Each entity is stored only once, eliminating data duplication
2. **Efficient Updates**: Updating an entity in one place updates it everywhere it's referenced
3. **Simpler State Management**: Flat data structures are easier to manage than deeply nested ones
4. **Performance**: Reduces unnecessary re-renders when only part of an entity changes
5. **Consistency**: Ensures data consistency across the application

## Implementation Details

### Entity Models

The application uses three main entity types:

- **User**: Represents authors with username and name
- **Comment**: Contains the comment text and references a user as the author
- **Post**: Contains the post content, references a user as the author, and has an array of comment IDs

### Entity Configuration

Each entity type has its own configuration with:

- Entity type definition
- Collection name
- Custom ID selector function

### Normalization Process

The demo includes a `normalizeBlogData` function that:

1. Takes nested blog data (posts with nested authors and comments)
2. Extracts all unique users, comments, and posts
3. Replaces nested objects with references by ID
4. Returns collections of normalized entities

### Store Operations

The store provides methods to:

- Load normalized blog data
- Add, update, and remove entities
- Handle relationships between entities (e.g., adding a comment to a post)

### Denormalization

The store includes a computed signal that creates a denormalized view of posts with their authors and comments, which is useful for displaying in the UI.

## Running the Demo

1. Clone the repository
2. Run `npm install`
3. Run `ng serve`
4. Open your browser to `http://localhost:4200`

The demo UI shows:
- The normalized data structure (users, comments, posts)
- The denormalized view for display
- Buttons to perform actions that demonstrate how the normalized store updates

## Based On

This demo is based on the normalization concepts from Redux as described in:
https://redux.js.org/usage/structuring-reducers/normalizing-state-shape

But implemented using NgRx Signal Store's entity management features:
https://ngrx.io/guide/signals/signal-store/entity-management
