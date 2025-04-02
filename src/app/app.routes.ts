import { Routes } from '@angular/router';
import { BlogDemoComponent } from './components/blog-demo/blog-demo.component';
import { NormalizedBlogDemoComponent } from './components/normalized-blog-demo/normalized-blog-demo.component';

export const routes: Routes = [
  { path: '', component: BlogDemoComponent },
  { path: 'blog-demo', component: BlogDemoComponent },
  { path: 'normalized-blog-demo', component: NormalizedBlogDemoComponent },
];
