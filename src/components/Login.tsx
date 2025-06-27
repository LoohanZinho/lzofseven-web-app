'use client';

import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase/firebaseConfig';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in page.tsx will handle the rest.
    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-6">
        <h1 className="text-5xl font-bold tracking-tighter">LZ Notepad</h1>
        <p className="text-lg text-muted-foreground">Seu bloco de notas, simples e na nuvem.</p>
        <Button onClick={handleLogin} size="lg" disabled={isLoggingIn}>
           {isLoggingIn ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Aguardando...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8 0 120.5 109.8 8 244 8c66.8 0 126 23.4 172.9 61.6l-58.2 57.3C337.3 99.4 294.3 86.6 244 86.6c-79.6 0-144.1 64.4-144.1 144.1s64.5 144.1 144.1 144.1c92.8 0 135.2-74.4 140.8-109.9H244V261.8h244z"></path>
              </svg>
              Entrar com Google
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
