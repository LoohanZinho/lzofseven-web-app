'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { NoteSummary } from '@/app/page';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import CryptoJS from 'crypto-js';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pin, Save, Lock, Share2, Copy, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import TiptapToolbar from './TiptapToolbar';


type NoteEditorProps = {
  noteId: string;
  allNotes: NoteSummary[];
  onSaveAndNew: () => Promise<void>;
};

const parseTags = (htmlContent: string): string[] => {
  const textContent = htmlContent.replace(/<[^>]*>?/gm, ' ');
  const tagRegex = /#([\p{L}\p{N}_]+)/gu;
  const matches = textContent.match(tagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.substring(1)))];
};

const slugify = (text: string) => {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrssssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export default function NoteEditor({ noteId, allNotes, onSaveAndNew }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [isPrivate, setIsPrivate] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [encryptedDbContent, setEncryptedDbContent] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [promptAction, setPromptAction] = useState<'unlock' | 'create'>('unlock');
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  const { toast } = useToast();
  const debouncedTitle = useDebounce(title, 1500);
  const debouncedContent = useDebounce(content, 1500);

  const sessionPassword = useRef('');
  const isMounted = useRef(true);
  const lastSavedState = useRef({ title: '', content: '', isPrivate: false, publicSlug: null });
  const justSavedTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastKnownNoteId = useRef(noteId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: false,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none p-4 w-full h-full',
      },
    },
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (justSavedTimeout.current) {
        clearTimeout(justSavedTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const { from, to } = editor.state.selection;
      if (editor.getHTML() !== content) {
          editor.commands.setContent(content, false, { preserveWhitespace: "full" });
          editor.commands.setTextSelection({ from, to });
      }
    }
  }, [content, editor]);

  useEffect(() => {
    setIsLoading(true);
    
    // Reset password and lock status ONLY when the note ID actually changes
    if (lastKnownNoteId.current !== noteId) {
      sessionPassword.current = '';
      setIsLocked(false);
      lastKnownNoteId.current = noteId;
    }
    
    const noteRef = doc(db, 'notes', noteId);
    const unsubscribe = onSnapshot(noteRef, (docSnapshot) => {
      if (!docSnapshot.exists() || !isMounted.current) {
        console.error("Note not found!");
        setIsLoading(false);
        return;
      }
      
      const data = docSnapshot.data();
      const noteIsPrivate = data.isPrivate || false;
      const dbEncrypted = data.encryptedContent || '';
      let newContent = '';

      // Always update metadata
      setTitle(currentTitle => docSnapshot.metadata.hasPendingWrites ? currentTitle : data.title || '');
      setPinned(data.pinned || false);
      setUpdatedAt(data.updatedAt?.toDate() || null);
      setPublicSlug(data.publicSlug || null);
      setIsPrivate(noteIsPrivate);

      if (noteIsPrivate) {
        setEncryptedDbContent(dbEncrypted);

        // If we have a password, try to decrypt. This handles server updates.
        // If we don't, lock the note and prompt for it.
        if (sessionPassword.current) {
          try {
            const bytes = CryptoJS.AES.decrypt(dbEncrypted, sessionPassword.current);
            newContent = bytes.toString(CryptoJS.enc.Utf8);
            if (!newContent && dbEncrypted) throw new Error("Decryption failed");
            setContent(newContent);
            setIsLocked(false);
          } catch (e) {
            console.error("Failed to decrypt with session password.", e);
            sessionPassword.current = ''; 
            setIsLocked(true);
            setPromptAction('unlock');
            setShowPasswordPrompt(true);
          }
        } else {
          setContent('');
          setIsLocked(true);
          setPromptAction('unlock');
          setShowPasswordPrompt(true);
        }
      } else {
        // Note is not private, so it can't be locked
        newContent = data.content || '';
        setContent(newContent);
        setIsLocked(false);
        setEncryptedDbContent('');
        sessionPassword.current = '';
      }
      
      if (!docSnapshot.metadata.hasPendingWrites) {
          lastSavedState.current = { 
            title: data.title || '', 
            content: newContent, 
            isPrivate: noteIsPrivate,
            publicSlug: data.publicSlug || null
          };
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [noteId]);
  
  const performSave = useCallback(async (isManualSave = false): Promise<string> => {
    if (isLoading) return '';
    
    const currentContent = editor?.getHTML() || content;
    const hasChanged = title !== lastSavedState.current.title || currentContent !== lastSavedState.current.content || isPrivate !== lastSavedState.current.isPrivate;
    
    if (!isManualSave && !hasChanged) {
      return title; 
    }

    if (justSavedTimeout.current) clearTimeout(justSavedTimeout.current);
    setIsSaving(true);
    setJustSaved(false);

    const noteRef = doc(db, 'notes', noteId);
    
    let finalTitle = title.trim();
    if (finalTitle === '' && (currentContent.replace(/<[^>]*>?/gm, '').trim() || isManualSave)) {
        const untitledNotes = allNotes.filter(n => n.id !== noteId && n.title.startsWith('Nota sem título'));
        const existingNumbers = untitledNotes.map(n => {
            const numPart = n.title.replace('Nota sem título', '').trim();
            return numPart === '' ? 1 : (parseInt(numPart) || 0);
        });
        const maxNum = existingNumbers.length > 0 ? Math.max(0, ...existingNumbers) : 0;
        finalTitle = `Nota sem título ${maxNum + 1}`;
    }

    const dataToSave: { [key: string]: any } = {
      title: finalTitle,
      tags: parseTags(currentContent),
      updatedAt: serverTimestamp(),
      isPrivate: isPrivate,
    };

    if (isPrivate) {
        if (!sessionPassword.current) {
            console.warn("Attempted to save private note without a password. Save aborted.");
            setIsSaving(false);
            return title;
        }
        const encrypted = CryptoJS.AES.encrypt(currentContent, sessionPassword.current).toString();
        dataToSave.encryptedContent = encrypted;
        dataToSave.content = '';
        setEncryptedDbContent(encrypted); // Keep our local encrypted state in sync
    } else {
        dataToSave.content = currentContent;
        dataToSave.encryptedContent = '';
    }

    try {
      await updateDoc(noteRef, { ...dataToSave });
      lastSavedState.current = { title: dataToSave.title, content: currentContent, isPrivate: isPrivate, publicSlug: publicSlug };

      if (isMounted.current) {
        setIsSaving(false);
        setJustSaved(true);
        justSavedTimeout.current = setTimeout(() => {
          if (isMounted.current) setJustSaved(false);
        }, 2000);
      }
      return dataToSave.title;
    } catch (error) {
      console.error("Error updating note:", error);
      if (isMounted.current) {
        setIsSaving(false);
        setJustSaved(false);
      }
      return '';
    }
  }, [noteId, title, content, isPrivate, allNotes, publicSlug, editor, isLoading]);

  useEffect(() => {
    const hasChanged = title !== lastSavedState.current.title || content !== lastSavedState.current.content || isPrivate !== lastSavedState.current.isPrivate;
    if (!isLoading && !isLocked && hasChanged) {
        performSave(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent, isPrivate]);
  
  const handleManualSave = async () => {
    const savedTitle = await performSave(true);
    toast({
      title: "Nota Salva!",
      description: `A nota "${savedTitle || 'sem título'}" foi salva com sucesso.`,
    });
    await onSaveAndNew();
  };

  const handleTogglePin = async () => {
    const noteRef = doc(db, 'notes', noteId);
    const newPinnedStatus = !pinned;
    setPinned(newPinnedStatus);
    await updateDoc(noteRef, { pinned: newPinnedStatus, updatedAt: serverTimestamp() });
  };
  
  const handleTogglePrivate = (checked: boolean) => {
    if (checked) {
      if(!sessionPassword.current){
        setPromptAction('create');
        setShowPasswordPrompt(true);
      } else {
        setIsPrivate(true);
      }
    } else {
      if (!isLocked) {
        setIsPrivate(false);
        toast({ title: "Proteção removida.", description: "A nota será salva como texto puro." });
      } else {
        toast({ variant: 'destructive', title: "Ação necessária", description: "Desbloqueie a nota antes de remover a proteção." });
      }
    }
  };
  
  const handlePasswordSubmit = () => {
    const password = passwordInput;
    if (!password) {
      toast({ variant: 'destructive', title: "Senha vazia", description: "Por favor, digite uma senha." });
      return;
    }

    if (promptAction === 'unlock') {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedDbContent, password);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText && encryptedDbContent) throw new Error("Decryption failed");
        setContent(decryptedText);
        sessionPassword.current = password;
        setIsLocked(false);
        setShowPasswordPrompt(false);
        setPasswordInput('');
        toast({ title: "Nota desbloqueada 🔓" });
      } catch (e) {
        toast({ variant: 'destructive', title: "Senha incorreta" });
      }
    } else if (promptAction === 'create') {
      sessionPassword.current = password;
      setIsPrivate(true);
      setIsLocked(false); // A new password also unlocks the note
      setShowPasswordPrompt(false);
      setPasswordInput('');
      toast({ title: "Nota protegida 🔒", description: "Sua nota agora será salva com criptografia." });
    }
  };

  const handleGenerateLink = async () => {
    if (isPrivate) {
      toast({ variant: 'destructive', title: "Ação bloqueada", description: "Notas privadas não podem ser compartilhadas."});
      return;
    }

    const baseSlug = slugify(title.trim() || 'nota-sem-titulo');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newSlug = `${baseSlug}-${randomSuffix}`;

    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { publicSlug: newSlug, updatedAt: serverTimestamp() });
    
    toast({ title: "Link público gerado!", description: "Agora você pode copiar o link para compartilhar."});
  };

  const handleStopSharing = async () => {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { publicSlug: null, updatedAt: serverTimestamp() });
    toast({ title: "Compartilhamento interrompido", description: "O link público não está mais ativo."});
  }

  const handleCopyLink = () => {
    if (!publicSlug) return;
    const url = `${window.location.origin}/n/${publicSlug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Link copiado para a área de transferência."});
  }

  const getStatusMessage = () => {
    if (isSaving) return 'Salvando...';
    if (justSaved) return 'Salvo ✅';
    if (updatedAt) {
        return `Salvo ${formatDistanceToNow(updatedAt, { addSuffix: true, locale: ptBR })}`;
    }
    return 'Comece a escrever...';
  };

  const PasswordPromptDialog = (
    <AlertDialog open={showPasswordPrompt} onOpenChange={setShowPasswordPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {promptAction === 'unlock' && 'Nota Protegida'}
            {promptAction === 'create' && 'Proteger Nota'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {promptAction === 'unlock' && 'Digite a senha para visualizar e editar esta nota.'}
            {promptAction === 'create' && 'Crie uma senha para esta nota. Ela não poderá ser recuperada se for perdida.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          type="password"
          placeholder="Sua senha secreta..."
          value={passwordInput}
          onChange={e => setPasswordInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setShowPasswordPrompt(false);
            setPasswordInput('');
            // If user cancels unlock, we can't do anything, the note remains locked.
          }}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handlePasswordSubmit}>
            {promptAction === 'unlock' ? 'Desbloquear' : 'Definir Senha'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isLoading || !editor) {
    return (
      <div className="p-4 md:p-8 space-y-4 h-full">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-[calc(100%-100px)] w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {PasswordPromptDialog}
      <div className="flex items-center justify-between border-b border-border p-4 gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da sua nota..."
          className="h-auto flex-grow border-0 bg-transparent p-0 text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Título da nota"
          disabled={isLocked}
        />
        <div className="flex items-center gap-1">
           <div className="flex items-center space-x-2">
                <Switch id="private-note-toggle" checked={isPrivate} onCheckedChange={handleTogglePrivate} disabled={isLoading || isLocked}/>
                <Label htmlFor="private-note-toggle">Privada</Label>
            </div>
          <Button variant="ghost" size="icon" onClick={handleManualSave} aria-label="Salvar nota e criar nova">
            <Save className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleTogglePin} aria-label="Fixar nota">
            <Pin className={cn("h-5 w-5", pinned ? "fill-current text-foreground" : "text-muted-foreground")} />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Compartilhar nota" disabled={isPrivate || isLocked}>
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Compartilhar Nota</h4>
                        <p className="text-sm text-muted-foreground">
                            {publicSlug 
                                ? "Qualquer pessoa com este link poderá ver esta nota."
                                : "Gere um link público para compartilhar esta nota (somente leitura)."
                            }
                        </p>
                    </div>
                    {publicSlug ? (
                        <div className="grid gap-2">
                            <Label htmlFor="link">Link Público</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="link"
                                    value={`${window.location.origin}/n/${publicSlug}`}
                                    readOnly
                                    className="h-8 flex-1"
                                />
                                <Button onClick={handleCopyLink} size="icon" className="h-8 w-8">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button onClick={handleStopSharing} variant="destructive" size="sm" className="mt-2 w-full">
                                <XCircle className="mr-2 h-4 w-4" />
                                Parar de compartilhar
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={handleGenerateLink} disabled={isPrivate || isLocked}>Gerar Link</Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {isLocked && isPrivate ? (
          <div className="flex flex-col items-center justify-center flex-grow p-8 text-center bg-muted/20">
              <Lock className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold">Nota Bloqueada</h2>
              <p className="text-muted-foreground mt-2">Esta nota está criptografada.</p>
              <Button className="mt-6" onClick={() => { setPromptAction('unlock'); setShowPasswordPrompt(true); }}>Desbloquear Nota</Button>
          </div>
        ) : (
          <>
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} className="flex-grow overflow-y-auto" />
          </>
        )}
      </div>

      <footer className="h-8 flex-shrink-0 border-t bg-background p-2 text-center text-xs text-muted-foreground">
        {isLocked && isPrivate ? "Nota está bloqueada 🔒" : getStatusMessage()}
      </footer>
    </div>
  );
}
