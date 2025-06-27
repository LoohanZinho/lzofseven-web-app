'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

type NoteEditorProps = {
  noteId: string;
};

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  // Ref to track if the initial load is done for debouncing
  const isInitialLoadDone = useRef(false);

  // Firestore real-time listener
  useEffect(() => {
    setIsLoading(true);
    isInitialLoadDone.current = false;
    const noteRef = doc(db, 'notes', noteId);
    const unsubscribe = onSnapshot(noteRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        if (!docSnapshot.metadata.hasPendingWrites) {
          setTitle(docSnapshot.data().title || '');
          setContent(docSnapshot.data().content || '');
        }
      } else {
        console.error("Note not found!");
      }
      setIsLoading(false);
      setTimeout(() => { isInitialLoadDone.current = true; }, 500);
    });

    return () => unsubscribe();
  }, [noteId]);

  // Debounced autosave
  useEffect(() => {
    if (!isInitialLoadDone.current) return;

    const noteRef = doc(db, 'notes', noteId);
    setSaveStatus('saving');
    updateDoc(noteRef, {
      title: debouncedTitle,
      content: debouncedContent,
      updatedAt: serverTimestamp(),
    }).then(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);

  const getStatusMessage = () => {
    if (saveStatus === 'saving') return 'Salvando...';
    if (saveStatus === 'saved') return 'Salvo ✅';
    return '';
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-4 h-full">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-[calc(100%-100px)] w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da sua nota..."
          className="text-2xl font-bold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
          aria-label="Título da nota"
        />
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Comece a escrever… tudo salva sozinho."
        className="flex-grow resize-none border-0 bg-transparent p-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0 md:p-8"
        aria-label="Editor de notas"
      />
      <footer className="flex-shrink-0 border-t bg-background p-2 text-center text-xs text-muted-foreground h-8">
        {getStatusMessage()}
      </footer>
    </div>
  );
}
