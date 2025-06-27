'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Menu, Plus, Trash2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

// Define the type for a single note
type Note = {
  id: string;
  title: string;
  content: string;
  savedAt: string; // ISO string for easy storage and parsing
};

const LOCAL_STORAGE_KEY = 'notepad_notes_history';

export default function NoteEditor() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentNote = notes.find(note => note.id === currentNoteId);

  // Debounce the editable fields of the note to trigger autosave
  const debouncedTitle = useDebounce(currentNote?.title, 500);
  const debouncedContent = useDebounce(currentNote?.content, 500);

  // This function is defined outside useEffect to be callable from multiple places
  const handleNewNote = (setAsCurrent = true, initialNotes: Note[] = []) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      savedAt: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...initialNotes];
    setNotes(updatedNotes);
    if (setAsCurrent) {
        setCurrentNoteId(newNote.id);
    }
    setIsSheetOpen(false); // Close sheet after creating new note
    return updatedNotes;
  };

  // Load notes from localStorage on initial render
  useEffect(() => {
    try {
      const savedNotesRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedNotesRaw) {
        const savedNotes: Note[] = JSON.parse(savedNotesRaw);
        if (savedNotes.length > 0) {
          // Sort by date to find the most recent
          const sortedNotes = savedNotes.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
          setNotes(sortedNotes);
          setCurrentNoteId(sortedNotes[0].id);
        } else {
            // if storage is empty, create a new note
            handleNewNote(true);
        }
      } else {
        // if no storage, create a new note
        handleNewNote(true);
      }
    } catch (error) {
      console.error("Error fetching notes from localStorage:", error);
      // If error, start fresh
      handleNewNote(true);
    } finally {
      setIsLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save notes to localStorage whenever the notes array changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  // The function that performs the "save" by updating the timestamp
  const handleSaveNote = useCallback(() => {
    if (!currentNoteId) return;

    setSaveStatus('saving');
    // Using a timeout to ensure the 'saving' message is visible for a moment
    // as state updates can be very fast.
    setTimeout(() => {
      setNotes(currentNotes =>
        currentNotes.map(note =>
          note.id === currentNoteId ? { ...note, savedAt: new Date().toISOString() } : note
        ).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  }, [currentNoteId]);
  
  // Trigger autosave when debounced title or content changes
  useEffect(() => {
    if (isLoaded && currentNote) {
      handleSaveNote();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);

  const handleSelectNote = (id: string) => {
    setCurrentNoteId(id);
    setIsSheetOpen(false); // Close sheet after selection
  };
  
  const handleDeleteNote = (idToDelete: string) => {
      const remainingNotes = notes.filter(note => note.id !== idToDelete);
      setNotes(remainingNotes);

      // if the deleted note was the current one, select the next available one or create new
      if(currentNoteId === idToDelete) {
          if(remainingNotes.length > 0) {
              setCurrentNoteId(remainingNotes[0].id);
          } else {
              handleNewNote(true, []);
          }
      }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentNoteId) return;
    setNotes(currentNotes =>
      currentNotes.map(note =>
        note.id === currentNoteId ? { ...note, title: e.target.value } : note
      )
    );
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentNoteId) return;
    setNotes(currentNotes =>
      currentNotes.map(note =>
        note.id === currentNoteId ? { ...note, content: e.target.value } : note
      )
    );
  };

  const getStatusMessage = () => {
    if (saveStatus === 'saving') return 'Salvando...';
    if (saveStatus === 'saved') return 'Salvo!';
    if (currentNote?.savedAt) {
      return `Último salvamento: ${new Date(currentNote.savedAt).toLocaleTimeString('pt-BR')}`;
    }
    return '';
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-full p-2 md:p-4 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-1/3 rounded-md" />
        </div>
        <Skeleton className="h-[calc(100vh-80px)] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-shrink-0 items-center gap-2 border-b p-2">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Histórico de notas">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Histórico de Notas</SheetTitle>
              <SheetDescription>
                Aqui estão suas notas salvas. Clique para editar ou crie uma nova.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
                <Button onClick={() => handleNewNote(true, notes)} className="w-full mb-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Nota
                </Button>
                <div className="space-y-2">
                {notes.map(note => (
                  <div key={note.id} className="group flex items-center justify-between rounded-md p-2 hover:bg-accent" onClick={() => handleSelectNote(note.id)} style={{cursor: 'pointer'}}>
                    <div className="truncate pr-2">
                        <p className="font-medium">{note.title || 'Nota sem título'}</p>
                        <p className="text-xs text-muted-foreground">
                        {new Date(note.savedAt).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Apagar nota</span>
                    </Button>
                  </div>
                ))}
                </div>
            </div>
          </SheetContent>
        </Sheet>

        <Input
          value={currentNote?.title || ''}
          onChange={handleTitleChange}
          placeholder="Título (opcional)"
          className="text-lg font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Título da nota"
        />
        
        <Button onClick={handleSaveNote} variant="outline" size="icon" aria-label="Salvar nota agora">
          <Save className="h-5 w-5" />
        </Button>

      </header>
      
      <Textarea
        value={currentNote?.content || ''}
        onChange={handleContentChange}
        placeholder="Comece a escrever..."
        className="flex-grow resize-none border-0 bg-background p-4 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 md:p-8"
        aria-label="Editor de notas"
      />

      <footer className="flex-shrink-0 border-t bg-background p-2 text-center text-xs text-muted-foreground">
        {getStatusMessage()}
      </footer>
    </div>
  );
}
