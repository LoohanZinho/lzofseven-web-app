'use client';

import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react';
import {
  FileSignature,
  Loader2,
  TextQuote,
  WrapText,
  CaseLower,
  Expand,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { processNote, type NoteActionInput } from '@/ai/flows/process-note-flow';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      {menuItems.map(item => (
        <Tooltip key={item.action}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAiAction(item.action as AiAction)}
              disabled={!!loadingAction}
            >
              {loadingAction === item.action ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <item.icon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </BubbleMenu>
  );
}
