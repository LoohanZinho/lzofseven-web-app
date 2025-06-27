'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';

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

  // Debounce user input to avoid saving on every keystroke
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedContent = useDebounce(content, 1000);

  // Ref to track if this is the first time the component loads for a specific note
  const isInitialLoadRef = useRef(true);

  // Load note data from Firestore
  useEffect(() => {
    isInitialLoadRef.current = true; // Reset for new note
    setIsLoading(true);
    setSaveStatus('idle');

    const noteRef = doc(db, 'notes', noteId);
    const unsubscribe = onSnapshot(noteRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // Only set state on the very first load. This prevents overwriting
        // the user's current input with data from the server (e.g., an echo of their own save).
        if (isInitialLoadRef.current) {
          setTitle(data.title || '');
          setContent(data.content || '');
          isInitialLoadRef.current = false;
        }
        
        setPinned(data.pinned || false);
        setUpdatedAt(data.updatedAt?.toDate() || null);
        setIsLoading(false);
      } else {
        console.error("Note not found!");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [noteId]);

  // Effect to save the note when debounced values change
  useEffect(() => {
    // Do not save on the initial render cycle
    if (isInitialLoadRef.current) {
      return;
    }

    setSaveStatus('saving');
    const noteRef = doc(db, 'notes', noteId);
    const currentTags = parseTags(debouncedContent);

    updateDoc(noteRef, {
      title: debouncedTitle,
      content: debouncedContent,
      tags: currentTags,
      updatedAt: serverTimestamp(),
    }).then(() => {
      setSaveStatus('saved');
      // After showing "Salvo", revert to "idle" to show the timestamp again.
      setTimeout(() => setSaveStatus('idle'), 2000);
    }).catch(error => {
      console.error("Error updating note:", error);
      setSaveStatus('idle'); // Revert on error too
    });

  // This effect runs only when the debounced values change, or the noteId changes.
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
