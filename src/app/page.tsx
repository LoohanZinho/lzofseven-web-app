'use client';

import NoteEditor from '@/components/NoteEditor';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NoteEditor />
    </main>
  );
}
