import type { User } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, NotebookPen } from 'lucide-react';

type HeaderProps = {
  user: User;
};

export default function Header({ user }: HeaderProps) {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <NotebookPen className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">LZ Notepad</h1>
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
