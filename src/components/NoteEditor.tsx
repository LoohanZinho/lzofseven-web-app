'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useDebounce } from '@/hooks/useDebounce';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

interface NoteEditorProps {
  user: User;
}

type SavingStatus = 'idle' | 'saving' | 'saved';

export default function NoteEditor({ user }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SavingStatus>('idle');
  const [isLoaded, setIsLoaded] = useState(false);
  const debouncedContent = useDebounce(content, 500);

  // Ref to prevent saving on the very first render after fetching data
  const isInitialLoadSave = useRef(true);

  const getNoteDocRef = useCallback(() => {
    return doc(db, 'notes', user.uid);
  }, [user.uid]);

  // Fetch initial note content
  useEffect(() => {
    const fetchNote = async () => {
      const noteDocRef = getNoteDocRef();
      try {
        const docSnap = await getDoc(noteDocRef);
        if (docSnap.exists()) {
          setContent(docSnap.data().content);
        }
      } catch (error) {
        console.error("Error fetching note:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchNote();
  }, [getNoteDocRef]);

  // Save debounced content to Firestore
  useEffect(() => {
    if (!isLoaded) return;
    
    // This ref check prevents the save operation right after the initial content is loaded.
    if (isInitialLoadSave.current) {
        isInitialLoadSave.current = false;
        return;
    }

    const saveNote = async () => {
      const noteDocRef = getNoteDocRef();
      try {
        await setDoc(noteDocRef, { content: debouncedContent, updatedAt: serverTimestamp() }, { merge: true });
        setStatus('saved');
      } catch (error) {
        console.error("Error saving note:", error);
        setStatus('idle');
      }
    };
    
    saveNote();
  }, [debouncedContent, isLoaded, getNoteDocRef]);

  // Effect to fade out "Salvo" message
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
