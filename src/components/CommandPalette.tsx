'use client';

import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import type { NoteSummary } from '@/app/page';
import { File, PlusCircle, Trash2, Notebook } from 'lucide-react';

interface CommandPaletteProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    notes: NoteSummary[];
    onSelectNote: (id: string) => void;
    onNewNote: () => void;
    onDeleteNote: () => void;
}

export function CommandPalette({
    open,
    setOpen,
    notes,
    onSelectNote,
    onNewNote,
    onDeleteNote
}: CommandPaletteProps) {
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen(!open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, setOpen]);
    
    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    }

    return (
        <Command.Dialog open={open} onOpenChange={setOpen}>
            <Command.Input placeholder="Digite um comando ou busque..." />
            <Command.List>
                <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
                <Command.Group heading="Ações">
                    <Command.Item onSelect={() => runCommand(onNewNote)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Nova Nota</span>
                    </Command.Item>
                    <Command.Item onSelect={() => runCommand(onDeleteNote)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Deletar Nota Atual</span>
                    </Command.Item>
                </Command.Group>
                <Command.Group heading="Navegar para">
                    {notes.map(note => (
                        <Command.Item key={note.id} onSelect={() => onSelectNote(note.id)}>
                            <Notebook className="mr-2 h-4 w-4" />
                            <span>{note.title || 'Nota sem título'}</span>
                        </Command.Item>
                    ))}
                </Command.Group>
            </Command.List>
        </Command.Dialog>
    );
}
