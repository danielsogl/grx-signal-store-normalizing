export interface Post {
  id: string;
  author: string; // username reference to User
  body: string;
  comments: string[]; // array of comment IDs
}
