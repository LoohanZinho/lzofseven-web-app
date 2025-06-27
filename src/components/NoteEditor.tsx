'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { NoteSummary } from '@/app/page';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pin, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';

type NoteEditorProps = {
  noteId: string;
  allNotes: NoteSummary[];
  onSaveAndNew: () => Promise<void>;
};

const parseTags = (content: string): string[] => {
  const tagRegex = /#([\p{L}\p{N}_]+)/gu;
  const matches = content.match(tagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.substring(1)))];
};

export default function NoteEditor({ noteId, allNotes, onSaveAndNew }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const debouncedTitle = useDebounce(title, 1500);
  const debouncedContent = useDebounce(content, 1500);
  
  const isMounted = useRef(false);
  const hasLoadedFromServer = useRef(false);

  // Load note data from Firestore
  useEffect(() => {
    setIsLoading(true);
    hasLoadedFromServer.current = false;
    isMounted.current = true;
    
    const noteRef = doc(db, 'notes', noteId);
    const unsubscribe = onSnapshot(noteRef, (docSnapshot) => {
      if (docSnapshot.exists() && isMounted.current) {
        const data = docSnapshot.data();
        setTitle(data.title || '');
        setContent(data.content || '');
        setPinned(data.pinned || false);
        setUpdatedAt(data.updatedAt?.toDate() || null);
        setIsLoading(false);
        hasLoadedFromServer.current = true;
      } else {
        console.error("Note not found!");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [noteId]);
  
  const performSave = useCallback(async (successCallback?: () => void) => {
    if (!hasLoadedFromServer.current) return;

    setSaveStatus('saving');
    const noteRef = doc(db, 'notes', noteId);
    
    let finalTitle = title.trim();
    if (finalTitle === '') {
      const untitledNotes = allNotes.filter(n => n.title.startsWith('Nota sem título'));
      const existingNumbers = untitledNotes.map(n => {
        const num = parseInt(n.title.replace('Nota sem título', '').trim());
        return isNaN(num) ? 0 : num;
      });
      const maxNum = Math.max(0, ...existingNumbers);
      finalTitle = `Nota sem título ${maxNum + 1}`;
    }

    const dataToSave = {
      title: finalTitle,
      content: content,
      tags: parseTags(content),
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(noteRef, dataToSave);
      
      if(finalTitle !== title) {
        setTitle(finalTitle); // Update local state if title was auto-generated
      }
      
      setSaveStatus('saved');
      if (successCallback) {
        successCallback();
      }
      setTimeout(() => {
        if (isMounted.current) setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error("Error updating note:", error);
      if (isMounted.current) setSaveStatus('idle');
    }
  }, [noteId, title, content, allNotes]);


  // Effect to auto-save the note when debounced values change
  useEffect(() => {
    // Only run auto-save after initial load and if it's not the first render
    if (hasLoadedFromServer.current && isMounted.current) {
      performSave();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);
  
  const handleManualSave = async () => {
    await performSave(onSaveAndNew);
  };

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
      <div className="flex items-center justify-between border-b border-border p-4 gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da sua nota..."
          className="h-auto flex-grow border-0 bg-transparent p-0 text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Título da nota"
        />
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleManualSave} aria-label="Salvar nota e criar nova">
            <Save className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleTogglePin} aria-label="Fixar nota">
            <Pin className={cn("h-5 w-5", pinned ? "fill-current text-foreground" : "text-muted-foreground")} />
          </Button>
        </div>
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
