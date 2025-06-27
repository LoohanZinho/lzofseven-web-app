import type { User } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { LogOut, NotebookPen, Search, PanelLeft } from 'lucide-react';

type HeaderProps = {
  user: User;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onMenuClick: () => void;
};

export default function Header({ user, searchTerm, setSearchTerm, onMenuClick }: HeaderProps) {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
        <NotebookPen className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold hidden sm:block">LZ Notepad</h1>
      </div>
      
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar notas..."
          className="w-full rounded-lg bg-background pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
