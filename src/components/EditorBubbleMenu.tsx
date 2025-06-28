'use client';

import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react';
import {
  Sparkles,
  FileSignature,
  Loader2,
  TextQuote,
  WrapText,
  CaseLower,
  Expand,
  List,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { processNote, type NoteActionInput } from '@/ai/flows/process-note-flow';
import { useToast } from '@/hooks/use-toast';

type Props = {
  editor: Editor | null;
};

type AiAction = NoteActionInput['action'];

const getActionTitle = (action: AiAction): string => {
    switch(action) {
        case 'correct': return 'Corrigido';
        case 'summarize': return 'Resumido';
        case 'rephrase_creative': return 'Parafraseado';
        case 'simplify': return 'Simplificado';
        case 'expand': return 'Expandido';
        case 'bullet_points': return 'Convertido em tópicos';
        default: return 'Ação de IA concluída';
    }
}

export default function EditorBubbleMenu({ editor }: Props) {
  const [loadingAction, setLoadingAction] = useState<AiAction | null>(null);
  const { toast } = useToast();

  if (!editor) {
    return null;
  }
  
  const handleAiAction = async (action: AiAction) => {
    if (loadingAction) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText) {
        toast({ variant: 'destructive', title: 'Nenhum texto selecionado.' });
        return;
    }

    setLoadingAction(action);
    try {
      const { result } = await processNote({ text: selectedText, action });
      
      editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();

      toast({ title: `${getActionTitle(action)} com sucesso!` });
    } catch (error) {
      console.error("AI action failed:", error);
      toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível completar a ação.' });
    } finally {
      setLoadingAction(null);
    }
  };
  
  const menuItems: { action: AiAction; icon: React.ElementType; label: string }[] = [
    { action: 'correct', icon: FileSignature, label: 'Corrigir' },
    { action: 'summarize', icon: TextQuote, label: 'Resumir' },
    { action: 'rephrase_creative', icon: WrapText, label: 'Parafrasear' },
    { action: 'simplify', icon: CaseLower, label: 'Simplificar' },
    { action: 'expand', icon: Expand, label: 'Expandir' },
    { action: 'bullet_points', icon: List, label: 'Gerar Tópicos' },
  ];

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'top-start' }}
      className="flex items-center gap-1 p-1 rounded-md bg-background border border-border shadow-lg"
      shouldShow={({ state, from, to }) => {
        return from !== to;
      }}
    >
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Sparkles className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {menuItems.map(item => (
                    <DropdownMenuItem 
                        key={item.action} 
                        onSelect={() => handleAiAction(item.action as AiAction)}
                        disabled={!!loadingAction}
                    >
                        {loadingAction === item.action ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <item.icon className="mr-2 h-4 w-4" />
                        )}
                        <span>{item.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    </BubbleMenu>
  );
}
