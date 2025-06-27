'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type NoteEditorProps = {
  noteId: string;
};

const parseTags = (content: string): string[] => {
  const tagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = content.match(tagRegex);
  if (!matches) return [];
  // Return unique tags without the '#'
  return [...new Set(matches.map(tag => tag.substring(1)))];
};

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  const isInitialLoadDone = useRef(false);

  // Firestore real-time listener
  useEffect(() => {
    setIsLoading(true);
    isInitialLoadDone.current = false;
    const noteRef = doc(db, 'notes', noteId);
    const unsubscribe = onSnapshot(noteRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        // Avoid overwriting local state if the change came from this client
        if (!docSnapshot.metadata.hasPendingWrites) {
          setTitle(data.title || '');
          setContent(data.content || '');
        }
        setPinned(data.pinned || false);
        setUpdatedAt(data.updatedAt?.toDate() || null);
      } else {
        console.error("Note not found!");
      }
      setIsLoading(false);
      // Give a moment for debounced values to catch up before enabling autosave
      setTimeout(() => { isInitialLoadDone.current = true; }, 500);
    });

    return () => unsubscribe();
  }, [noteId]);

  // Debounced autosave
  useEffect(() => {
    // Prevent saving on initial load or if the note ID is not set
    if (!isInitialLoadDone.current || !noteId) return;

    const noteRef = doc(db, 'notes', noteId);
    setSaveStatus('saving');
    
    const tags = parseTags(debouncedContent);

    updateDoc(noteRef, {
      title: debouncedTitle,
      content: debouncedContent,
      tags: tags,
      updatedAt: serverTimestamp(),
    }).then(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }).catch(error => {
        console.error("Error updating note:", error);
        setSaveStatus('idle');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent, noteId]);
  
  const handleTogglePin = async () => {
    const noteRef = doc(db, 'notes', noteId);
    const newPinnedStatus = !pinned;
    setPinned(newPinnedStatus); // Optimistic update
    await updateDoc(noteRef, { pinned: newPinnedStatus, updatedAt: serverTimestamp() });
  };

  const getStatusMessage = () => {
    if (saveStatus === 'saving') return 'Salvando...';
    if (saveStatus === 'saved') return 'Salvo ✅';
    if (updatedAt) {
        return `Salvo ${formatDistanceToNow(updatedAt, { addSuffix: true, locale: ptBR })}`;
    }
    return 'Comece a escrever...';
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
      <div className="flex items-center justify-between border-b border-border p-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da sua nota..."
          className="h-auto flex-grow border-0 bg-transparent p-0 text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Título da nota"
        />
        <Button variant="ghost" size="icon" onClick={handleTogglePin} aria-label="Fixar nota">
          <Star className={cn("h-5 w-5", pinned ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
        </Button>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Comece a escrever… tudo salva sozinho. Use #tags para organizar."
        className="flex-grow resize-none border-0 bg-transparent p-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0 md:p-8"
        aria-label="Editor de notas"
      />
      <footer className="h-8 flex-shrink-0 border-t bg-background p-2 text-center text-xs text-muted-foreground">
        {getStatusMessage()}
      </footer>
    </div>
  );
}
