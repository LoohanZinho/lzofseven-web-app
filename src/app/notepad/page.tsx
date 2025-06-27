'use client';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

type Note = {
  id: number;
  title: string;
  content: string;
  date: string;
};

const initialNotes: Note[] = [
  {
    id: 1,
    title: 'Meeting Notes',
    content: 'Discussed Q3 roadmap and new feature prioritization. Key takeaways: focus on user feedback and performance improvements.',
    date: new Date(Date.now() - 86400000).toLocaleDateString(),
  },
  {
    id: 2,
    title: 'Project Ideas',
    content: '1. A tool to check domain availability. 2. A password generator. 3. A JSON formatter.',
    date: new Date(Date.now() - 2 * 86400000).toLocaleDateString(),
  },
];

export default function NotepadPage() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now(),
      title: newNoteTitle,
      content: newNoteContent,
      date: new Date().toLocaleDateString(),
    };
    setNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsDialogOpen(false);
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Notepad</h1>
            <p className="text-muted-foreground">
              Create and manage your personal notes.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a new note</DialogTitle>
                <DialogDescription>
                  Add a title and content for your new note. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  id="title"
                  placeholder="Note title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="col-span-3"
                />
                <Textarea
                  id="content"
                  placeholder="Type your note content here."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="col-span-3 min-h-[120px]"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" onClick={handleAddNote}>Save Note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {notes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Card key={note.id} className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="break-words">{note.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -mt-2 -mr-2"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {note.content}
                  </p>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">{note.date}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-16 text-center">
            <Notebook className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold">No notes yet</h3>
            <p className="text-muted-foreground">Click "New Note" to get started.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
