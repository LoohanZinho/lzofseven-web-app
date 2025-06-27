'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import Header from '@/components/Header';
import NotesList from '@/components/NotesList';
import NoteEditor from '@/components/NoteEditor';
import Login from '@/components/Login';
import TagFilter from '@/components/TagFilter';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { isToday, isYesterday } from 'date-fns';

export type NoteSummary = {
  id: string;
  title: string;
  pinned: boolean;
  tags: string[];
  isPrivate: boolean;
  updatedAt: Timestamp | null;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [groupedNotes, setGroupedNotes] = useState<{ [key: string]: NoteSummary[] }>({});

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
      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, 'notes'),
        where('ownerId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notesData: NoteSummary[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notesData.push({ 
            id: doc.id, 
            title: data.title || 'Nota sem título',
            pinned: data.pinned || false,
            tags: data.tags || [],
            isPrivate: data.isPrivate || false,
            updatedAt: data.updatedAt,
          });
        });
        
        // Perform sorting on the client-side
        notesData.sort((a, b) => {
          // Pinned notes first (descending)
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;

          // For notes with same pinned status, sort by date (descending)
          const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(0);
          const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setNotes(notesData);

        if (notesData.length > 0 && !activeNoteId) {
           setActiveNoteId(notesData[0].id);
        } else if (notesData.length === 0) {
            handleNewNote(true);
        }

        setLoadingNotes(false);
      }, (error) => {
        console.error("Error fetching notes: ", error);
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
        encryptedContent: '',
        isPrivate: false,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pinned: false,
        tags: []
      });
      if (setActive) {
        setActiveNoteId(newNoteRef.id);
      }
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const searchMatch = searchTerm.length > 0 
        ? note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      
      const tagMatch = selectedTag 
        ? note.tags.includes(selectedTag)
        : true;

      return searchMatch && tagMatch;
    });
  }, [notes, searchTerm, selectedTag]);

  const handleDeleteNote = async (noteId: string) => {
    const noteToDeleteIndex = filteredNotes.findIndex(n => n.id === noteId);
    
    if (noteId === activeNoteId) {
      if (filteredNotes.length > 1) {
        const nextNote = filteredNotes[noteToDeleteIndex > 0 ? noteToDeleteIndex - 1 : 1];
        setActiveNoteId(nextNote.id);
      } else {
        setActiveNoteId(null);
      }
    }
    
    await deleteDoc(doc(db, 'notes', noteId));
    
    if (activeNoteId === null && filteredNotes.length <=1) {
        handleNewNote(true);
    }
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  useEffect(() => {
    const groups: { [key: string]: NoteSummary[] } = {
      Hoje: [],
      Ontem: [],
      Anteriores: [],
    };

    filteredNotes.forEach(note => {
      if (!note.updatedAt?.toDate) {
        groups.Anteriores.push(note);
        return;
      }
      const noteDate = note.updatedAt.toDate();
      
      if (isToday(noteDate)) {
        groups.Hoje.push(note);
      } else if (isYesterday(noteDate)) {
        groups.Ontem.push(note);
      } else {
        groups.Anteriores.push(note);
      }
    });

    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    setGroupedNotes(groups);
  }, [filteredNotes]);
  
  useEffect(() => {
    if (activeNoteId && !filteredNotes.some(n => n.id === activeNoteId) && filteredNotes.length > 0) {
      setActiveNoteId(filteredNotes[0].id);
    }
  }, [filteredNotes, activeNoteId]);

  const handleSaveAndNew = async () => {
    await handleNewNote(true);
  }

  const SidebarInnerContent = () => (
    <>
      <NotesList
        notes={groupedNotes}
        activeNoteId={activeNoteId}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          setIsSidebarOpen(false); // Close sidebar on selection
        }}
        onNewNote={() => handleNewNote()}
        onDeleteNote={handleDeleteNote}
        loading={loadingNotes}
      />
      <Separator />
      <TagFilter 
        tags={allTags}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
      />
    </>
  );

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
      <Header 
        user={user} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        onMenuClick={() => setIsSidebarOpen(true)}
        notes={notes}
        onNoteSelect={(noteId) => {
          setActiveNoteId(noteId);
          setSearchTerm('');
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="md:hidden">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[300px]">
              <SidebarInnerContent />
            </SheetContent>
          </Sheet>
        </div>
        <aside className="hidden md:flex flex-col w-1/4 min-w-[250px] max-w-[350px] border-r border-border overflow-y-auto">
          <SidebarInnerContent />
        </aside>
        <main className="flex-1 flex flex-col">
          {activeNoteId ? (
            <NoteEditor 
              key={activeNoteId} 
              noteId={activeNoteId}
              allNotes={notes}
              onSaveAndNew={handleSaveAndNew}
            />
          ) : (
             <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              {loadingNotes ? (
                 <Skeleton className="h-24 w-48" />
              ) : (
                <>
                  <h2 className="text-2xl font-semibold">Nenhuma nota encontrada</h2>
                  <p className="mt-2 text-muted-foreground">
                    {searchTerm || selectedTag ? "Tente limpar a busca ou o filtro de tag." : "Crie uma nova nota para começar."}
                  </p>
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
