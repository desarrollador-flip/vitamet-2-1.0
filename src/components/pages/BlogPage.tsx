import { Blog1 } from '../exports/blog/Blog1';
import { Blog2 } from '../exports/blog/Blog2';
import { Blog3 } from '../exports/blog/Blog3';
import { Blog4 } from '../exports/blog/Blog4';

export function BlogPage() {
  return (
    <main className="blog">
      <Blog1 />
      <Blog2 />
      <Blog3 />
      <Blog4 />
    </main>
  );
}
