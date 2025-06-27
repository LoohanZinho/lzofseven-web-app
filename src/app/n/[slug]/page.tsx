'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Frown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PublicNote = {
  title: string;
  content: string;
  updatedAt: string;
};

export default function PublicNotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [note, setNote] = useState<PublicNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    if (!slug) return;

    const fetchNote = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/notes/public/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Nota não encontrada ou não é pública.');
          } else if (response.status === 403) {
            setError('Esta nota é privada e não pode ser compartilhada.');
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Ocorreu um erro ao carregar a nota.');
          }
          setIsLoading(false);
          return;
        }

        const noteData: PublicNote = await response.json();
        setNote(noteData);
      } catch (err) {
        console.error("Error fetching public note:", err);
        setError('Ocorreu um erro ao carregar a nota.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [slug]);

  useEffect(() => {
    if (note?.updatedAt) {
      setFormattedDate(
        format(new Date(note.updatedAt), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })
      );
    }
  }, [note]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <Card className="w-full max-w-md p-8 shadow-xl">
            <Frown className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-foreground">Oops!</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/')} variant="default">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o início
            </Button>
        </Card>
      </div>
    );
  }

  if (!note) {
    return null; // Should be covered by error state, but as a fallback
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl rounded-2xl shadow-xl p-8 my-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground break-words">{note.title || "Nota sem título"}</h1>
          <time className="text-sm text-muted-foreground h-5">
            {formattedDate && (
              <>
                Última atualização em{' '}
                {formattedDate}
              </>
            )}
          </time>
        </header>

        <article 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: note.content || '' }}
        />

        <Button onClick={() => router.push('/')} variant="default" className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Criar sua própria nota
        </Button>
      </Card>
    </div>
  );
}
