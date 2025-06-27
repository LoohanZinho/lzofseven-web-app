import type { NoteSummary } from '@/app/page';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Pin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

type NotesListProps = {
  notes: NoteSummary[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  loading: boolean;
};

export default function NotesList({ notes, activeNoteId, onSelectNote, onNewNote, onDeleteNote, loading }: NotesListProps) {
  return (
    <div className="flex flex-col h-full">
        <div className="p-2 shrink-0">
            <Button onClick={onNewNote} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Nota
            </Button>
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
                {loading && Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
                {!loading && notes.map(note => (
                <div key={note.id} className="group relative">
                    <button
                        onClick={() => onSelectNote(note.id)}
                        className={cn(
                            "w-full rounded-md p-2 text-left hover:bg-accent flex flex-col items-start gap-1",
                            note.id === activeNoteId ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-transparent"
                        )}
                    >
                        <div className="w-full flex items-center gap-2">
                          {note.pinned && <Pin className="h-4 w-4 flex-shrink-0 fill-current" />}
                          <span className="truncate text-sm font-medium">{note.title || "Nota sem título"}</span>
                        </div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                    </button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      aria-label="Excluir nota"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                </div>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
