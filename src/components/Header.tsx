import type { User } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { LogOut, NotebookPen, Search, PanelLeft } from 'lucide-react';
import type { NoteSummary } from '@/app/page';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

type HeaderProps = {
  user: User;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onMenuClick: () => void;
  notes: NoteSummary[];
  onNoteSelect: (id: string) => void;
};

export default function Header({ user, searchTerm, setSearchTerm, onMenuClick, notes, onNoteSelect }: HeaderProps) {
  const handleLogout = () => {
    signOut(auth);
  };

  const [results, setResults] = useState<NoteSummary[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const filteredResults = notes
        .filter(note =>
          (note.title || 'Nota sem título').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
        .sort((a, b) => { // Sort by relevance then date
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();
            const term = debouncedSearchTerm.toLowerCase();
            if (aTitle.startsWith(term) && !bTitle.startsWith(term)) return -1;
            if (!aTitle.startsWith(term) && bTitle.startsWith(term)) return 1;
            const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
            const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, 10);
      setResults(filteredResults);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setResults([]);
    }
  }, [debouncedSearchTerm, notes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setShowDropdown(false);
        }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleSelectNote = (noteId: string) => {
    onNoteSelect(noteId);
    setShowDropdown(false);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
        <NotebookPen className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold hidden sm:block">Notepad</h1>
      </div>
      
      <div className="relative flex-1 max-w-md" ref={searchContainerRef}>
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar notas..."
          className="w-full rounded-lg bg-background pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => { if(searchTerm) setShowDropdown(true) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) {
              e.preventDefault();
              handleSelectNote(results[0].id);
            }
          }}
        />
        {showDropdown && searchTerm && (
          <Card className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto z-50 shadow-lg border-border">
              {results.length > 0 ? (
                <ul className="p-1">
                  {results.map(note => (
                    <li key={note.id}>
                      <button
                        onClick={() => handleSelectNote(note.id)}
                        className="w-full text-left p-2 rounded-md hover:bg-accent flex justify-between items-center"
                      >
                        <span className="truncate pr-2">{note.title || "Nota sem título"}</span>
                        {note.updatedAt && (
                           <span className="text-xs text-muted-foreground flex-shrink-0">
                                {format(note.updatedAt.toDate(), 'dd/MM')}
                           </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma nota encontrada.</p>
              )}
          </Card>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Avatar'} />
            <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:block">{user.displayName}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
