'use client';

import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react';
import {
  TextQuote,
  Sparkles,
  FileSignature,
  Loader2,
  WrapText
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { processNote, type NoteActionInput } from '@/ai/flows/process-note-flow';
import { useToast } from '@/hooks/use-toast';

type Props = {
  editor: Editor | null;
};

type AiAction = NoteActionInput['action'];

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

      toast({ title: 'Ação de IA concluída!' });
    } catch (error) {
      console.error("AI action failed:", error);
      toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível completar a ação.' });
    } finally {
      setLoadingAction(null);
    }
  };
  
  const menuItems = [
    { action: 'correct' as AiAction, icon: FileSignature, label: 'Corrigir' },
    { action: 'summarize' as AiAction, icon: TextQuote, label: 'Resumir' },
    { action: 'rephrase_creative' as AiAction, icon: WrapText, label: 'Parafrasear' },
  ];

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 p-1 rounded-md bg-background border border-border shadow-lg"
      shouldShow={({ state, from, to }) => {
        return from !== to;
      }}
    >
        <span className="text-sm font-semibold text-muted-foreground px-2 flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> IA
        </span>
        <Separator orientation="vertical" className="h-6" />
        
        {menuItems.map(item => (
            <Toggle
                key={item.action}
                size="sm"
                aria-label={item.label}
                title={item.label}
                disabled={!!loadingAction}
                onPressedChange={() => handleAiAction(item.action)}
            >
                {loadingAction === item.action ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <item.icon className="h-4 w-4" />
                )}
            </Toggle>
        ))}
    </BubbleMenu>
  );
}
