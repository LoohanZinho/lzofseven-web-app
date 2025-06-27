'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { Button } from '@/components/ui/button';
import NoteEditor from '@/components/NoteEditor';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login com Google: ", error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {user ? (
        <NoteEditor user={user} />
      ) : (
        <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Bloco de Notas em Tempo Real</h1>
          <p className="max-w-md text-muted-foreground">
            Acesse suas anotações de qualquer lugar. Faça login com sua conta Google para começar.
          </p>
          <Button onClick={handleLogin} size="lg" className="mt-4">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 102.3 282.7 96 248 96c-106.1 0-192 85.9-192 192s85.9 192 192 192c60.8 0 111.7-25.6 146.1-65.6l-99.6-66.9H256v-96h232c1.7 10.4 2.5 21.1 2.5 31.8z"></path></svg>
            Entrar com Google
          </Button>
        </div>
      )}
    </main>
  );
}
