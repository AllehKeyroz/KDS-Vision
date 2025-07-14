'use server';

/**
 * @fileOverview Flow for creating and managing AI agents with custom prompts for each client.
 *
 * - createAgent - A function that handles the creation of an AI agent.
 * - CreateAgentInput - The input type for the createAgent function.
 * - CreateAgentOutput - The return type for the createAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateAgentInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  agentName: z.string().describe('The name of the AI agent.'),
  agentDescription: z.string().describe('A brief description of the AI agent.'),
  prompt: z.string().describe('The prompt for the AI agent.'),
});
export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;

const CreateAgentOutputSchema = z.object({
  agentId: z.string().describe('The unique ID of the created AI agent.'),
  message: z.string().describe('Confirmation message.'),
});
export type CreateAgentOutput = z.infer<typeof CreateAgentOutputSchema>;

export async function createAgent(input: CreateAgentInput): Promise<CreateAgentOutput> {
  return createAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createAgentPrompt',
  input: {schema: CreateAgentInputSchema},
  output: {schema: CreateAgentOutputSchema},
  prompt: `You are an AI agent creation assistant. Your task is to create a new AI agent for the client {{clientName}}.

Agent Name: {{agentName}}
Agent Description: {{agentDescription}}
Agent Prompt: {{prompt}}

Create the agent and return a success message and the agent ID.`,
});

const createAgentFlow = ai.defineFlow(
  {
    name: 'createAgentFlow',
    inputSchema: CreateAgentInputSchema,
    outputSchema: CreateAgentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // In a real implementation, you might save the agent details to a database here.
    // For now, we'll just return a dummy agent ID.
    return {
      agentId: 'dummy-agent-id-' + Math.random().toString(36).substring(7),
      message: `AI Agent "${input.agentName}" created successfully for client "${input.clientName}".`,//output?.message ?? 'AI Agent created successfully.',
    };
  }
);
