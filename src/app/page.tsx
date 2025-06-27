'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import Header from '@/components/Header';
import NotesList from '@/components/NotesList';
import NoteEditor from '@/components/NoteEditor';
import Login from '@/components/Login';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export type NoteSummary = {
  id: string;
  title: string;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
      setUser(firebaseUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoadingNotes(true);
      const q = query(
        collection(db, 'notes'),
        where('ownerId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notesData: NoteSummary[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notesData.push({ id: doc.id, title: data.title || 'Nota sem título' });
        });
        setNotes(notesData);

        if (notesData.length > 0) {
          if (!activeNoteId || !notesData.some(n => n.id === activeNoteId)) {
             setActiveNoteId(notesData[0].id);
          }
        } else {
            // If no notes exist, create one automatically
            handleNewNote(true);
        }
        setLoadingNotes(false);
      });
      return () => unsubscribe();
    } else {
      setNotes([]);
      setActiveNoteId(null);
      setLoadingNotes(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNewNote = async (setActive = true) => {
    if (user) {
      const newNoteRef = await addDoc(collection(db, 'notes'), {
        title: '',
        content: '',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPrivate: false,
        pinned: false,
        tags: []
      });
      if (setActive) {
        setActiveNoteId(newNoteRef.id);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (noteId === activeNoteId) {
      const currentIndex = notes.findIndex(n => n.id === noteId);
      if (notes.length > 1) {
        const nextNote = notes[currentIndex > 0 ? currentIndex - 1 : 1];
        setActiveNoteId(nextNote.id);
      } else {
        setActiveNoteId(null);
      }
    }
    await deleteDoc(doc(db, 'notes', noteId));
  }
  
  if (loadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }
  
  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col w-1/4 min-w-[250px] max-w-[350px] border-r border-border overflow-y-auto">
          <NotesList
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onNewNote={() => handleNewNote()}
            onDeleteNote={handleDeleteNote}
            loading={loadingNotes}
          />
        </aside>
        <main className="flex-1 flex flex-col">
          {activeNoteId ? (
            <NoteEditor key={activeNoteId} noteId={activeNoteId} />
          ) : (
             <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              {loadingNotes ? (
                 <Skeleton className="h-24 w-48" />
              ) : (
                <>
                  <h2 className="text-2xl font-semibold">Bem-vindo(a)!</h2>
                  <p className="mt-2 text-muted-foreground">Crie uma nova nota para começar.</p>
                  <Button onClick={() => handleNewNote()} className="mt-6">Criar Nova Nota</Button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
