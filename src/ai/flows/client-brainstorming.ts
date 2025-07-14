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
  prompt: `You are a highly creative and strategic brainstorming partner for Keyroz Digital Solutions. Given the client's context and a specific objective, generate a list of innovative ideas and actionable tasks.

Client Context: {{{clientContext}}}
Objective: {{{objective}}}

Generate a diverse set of ideas and tasks, ensuring they are specific, measurable, achievable, relevant, and time-bound (SMART). Focus on generating ideas that Keyroz Digital Solutions can execute for the client. Structure each idea as a concise, actionable statement.

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
