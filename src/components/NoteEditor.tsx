'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

type SavingStatus = 'idle' | 'saving' | 'saved';

const LOCAL_STORAGE_KEY = 'notepad_content';

export default function NoteEditor() {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SavingStatus>('idle');
  const [isLoaded, setIsLoaded] = useState(false);
  const debouncedContent = useDebounce(content, 500);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    try {
      const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedContent) {
        setContent(savedContent);
      }
    } catch (error) {
      console.error("Error fetching note from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }

    const saveNote = () => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, debouncedContent);
        setStatus('saved');
      } catch (error) {
        console.error("Error saving note to localStorage:", error);
        setStatus('idle');
      }
    };
    
    if (debouncedContent !== undefined) {
      saveNote();
    }
  }, [debouncedContent, isLoaded]);

  useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => setStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setStatus('saving');
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-full p-4 md:p-8">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Textarea
        value={content}
        onChange={handleChange}
        placeholder="Comece a escrever... tudo será salvo automaticamente."
        className="flex-grow resize-none border-0 bg-background p-4 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 md:p-8"
        aria-label="Editor de notas"
      />
      <footer className="flex-shrink-0 p-2 text-center text-sm text-muted-foreground h-10">
        {status === 'saving' && 'Salvando...'}
        {status === 'saved' && 'Salvo.'}
      </footer>
    </div>
  );
}
