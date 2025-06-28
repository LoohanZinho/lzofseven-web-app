'use server';
/**
 * @fileOverview Um agente de IA para processar texto de notas.
 *
 * - processNote - Uma função que lida com o processamento de notas.
 * - NoteActionInput - O tipo de entrada para a função processNote.
 * - NoteActionOutput - O tipo de retorno para a função processNote.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NoteActionInputSchema = z.object({
  text: z.string().describe('O texto da nota a ser processado.'),
  action: z
    .enum([
      'summarize',
      'correct',
      'generate_title',
      'rephrase_formal',
      'rephrase_creative',
    ])
    .describe('A ação de IA a ser executada.'),
});
export type NoteActionInput = z.infer<typeof NoteActionInputSchema>;

const NoteActionOutputSchema = z.object({
  result: z.string().describe('O resultado do processamento da IA.'),
});
export type NoteActionOutput = z.infer<typeof NoteActionOutputSchema>;

export async function processNote(
  input: NoteActionInput
): Promise<NoteActionOutput> {
  return processNoteFlow(input);
}

function getPromptTemplate(action: NoteActionInput['action']): string {
  switch (action) {
    case 'summarize':
      return 'Você é um assistente de escrita conciso. Resuma o seguinte texto em no máximo 3 frases claras e diretas. Sua resposta DEVE ser em português. Retorne apenas o resumo. Texto: {{{text}}}';
    case 'correct':
      return 'Você é um assistente de escrita e revisor especialista. Corrija a gramática e ortografia do texto a seguir, mantendo o estilo e a intenção original. Sua resposta DEVE ser em português. Retorne apenas o texto corrigido, sem adicionar comentários ou introduções. Texto: {{{text}}}';
    case 'generate_title':
      return 'Você é um editor criativo. Baseado no conteúdo a seguir, sugira um título curto, chamativo e relevante (máximo de 5 palavras). O título DEVE ser em português. Retorne apenas o título. Conteúdo: {{{text}}}';
    case 'rephrase_formal':
      return 'Reescreva o texto a seguir em um tom mais formal e profissional. Sua resposta DEVE ser em português. Retorne apenas o texto reescrito. Texto: {{{text}}}';
    case 'rephrase_creative':
      return 'Parafraseie o texto a seguir de forma mais criativa e engajante. Sua resposta DEVE ser em português. Retorne apenas o texto reescrito. Texto: {{{text}}}';
  }
}

const processNoteFlow = ai.defineFlow(
  {
    name: 'processNoteFlow',
    inputSchema: NoteActionInputSchema,
    outputSchema: NoteActionOutputSchema,
  },
  async (input) => {
    const promptTemplate = getPromptTemplate(input.action);

    const prompt = ai.definePrompt({
        name: `noteActionPrompt_${input.action}`,
        input: { schema: z.object({ text: z.string() }) },
        output: { schema: NoteActionOutputSchema },
        prompt: promptTemplate
    });
    
    const { output } = await prompt({ text: input.text });
    return output!;
  }
);
