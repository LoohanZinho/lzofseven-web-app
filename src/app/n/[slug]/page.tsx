'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Frown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PublicNote = {
  title: string;
  content: string;
  updatedAt: Timestamp;
};

export default function PublicNotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [note, setNote] = useState<PublicNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchNote = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'notes'),
          where('publicSlug', '==', slug),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Nota não encontrada.');
          setIsLoading(false);
          return;
        }

        const noteDoc = querySnapshot.docs[0];
        const noteData = noteDoc.data();

        if (noteData.isPrivate) {
          setError('Esta nota é privada e não pode ser compartilhada.');
          setIsLoading(false);
          return;
        }

        setNote({
          title: noteData.title,
          content: noteData.content,
          updatedAt: noteData.updatedAt,
        });
      } catch (err) {
        console.error("Error fetching public note:", err);
        setError('Ocorreu um erro ao carregar a nota.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 md:p-8">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center p-4">
        <Frown className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Oops!</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2" />
          Voltar para o início
        </Button>
      </div>
    );
  }

  if (!note) {
    return null; // Should be covered by error state, but as a fallback
  }

  return (
    <div className="flex justify-center items-start min-h-screen p-4 md:p-8 bg-muted/20">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader>
          <CardTitle className="text-4xl">{note.title || "Nota sem título"}</CardTitle>
          <CardDescription>
            Última atualização em{' '}
            {format(note.updatedAt.toDate(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap">
            {note.content}
          </div>
           <Button onClick={() => router.push('/')} className="mt-8">
            <ArrowLeft className="mr-2" />
            Criar sua própria nota
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
