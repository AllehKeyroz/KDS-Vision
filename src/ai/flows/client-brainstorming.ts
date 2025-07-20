// use server'
'use server';
/**
 * @fileOverview AI-powered brainstorming area for generating client-specific ideas and tasks.
 *
 * - clientBrainstorming - A function that handles the client brainstorming process.
 * - ClientBrainstormingInput - The input type for the clientBrainstorming function.
 * - ClientBrainstormingOutput - The return type for the clientBrainstorming function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClientBrainstormingInputSchema = z.object({
  clientContext: z
    .string()
    .describe(
      'Detailed context of the client, including their industry, target audience, business goals, and current challenges.'
    ),
  objective: z.string().describe('The specific objective for the brainstorming session.'),
});
export type ClientBrainstormingInput = z.infer<typeof ClientBrainstormingInputSchema>;

const ClientBrainstormingOutputSchema = z.object({
  ideas: z
    .array(z.string())
    .describe('A list of actionable ideas generated for the client based on the provided context and objective.'),
  tasks: z
    .array(z.string())
    .describe(
      'A list of specific tasks required to implement the generated ideas, with clear steps and responsibilities.'
    ),
});
export type ClientBrainstormingOutput = z.infer<typeof ClientBrainstormingOutputSchema>;

export async function clientBrainstorming(input: ClientBrainstormingInput): Promise<ClientBrainstormingOutput> {
  return clientBrainstormingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clientBrainstormingPrompt',
  input: {schema: ClientBrainstormingInputSchema},
  output: {schema: ClientBrainstormingOutputSchema},
  prompt: `Você é um parceiro de brainstorming altamente criativo e estratégico para a Keyroz Digital Solutions. Dado o contexto do cliente e um objetivo específico, gere uma lista de ideias e tarefas inovadoras. Responda inteiramente em português do Brasil.

Client Context: {{{clientContext}}}
Objective: {{{objective}}}

Gere um conjunto diversificado de ideias e tarefas, garantindo que sejam específicas, mensuráveis, alcançáveis, relevantes e com prazo definido (SMART). Concentre-se em gerar ideias que a Keyroz Digital Solutions possa executar para o cliente. Estruture cada ideia como uma declaração concisa e acionável.

Ideas:
- Idea 1: [Generated Idea]
- Idea 2: [Generated Idea]

Tasks:
- Task 1: [Generated Task]
- Task 2: [Generated Task]`,
});

const clientBrainstormingFlow = ai.defineFlow(
  {
    name: 'clientBrainstormingFlow',
    inputSchema: ClientBrainstormingInputSchema,
    outputSchema: ClientBrainstormingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
