// use server'

/**
 * @fileOverview Social Strategist IA: Generates social media post ideas and content strategies.
 *
 * - socialStrategistIA - A function that generates social media content ideas and strategies.
 * - SocialStrategistIAInput - The input type for the socialStrategistIA function.
 * - SocialStrategistIAOutput - The return type for the socialStrategistIA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialStrategistIAInputSchema = z.object({
  clientContext: z
    .string()
    .describe(
      'Detailed context of the client, including their industry, target audience, brand voice, and goals.'
    ),
  recentPosts: z
    .string()
    .optional()
    .describe(
      'Optional: Examples of recent social media posts by the client, for context and style adaptation.'
    ),
  desiredPlatforms: z
    .string()
    .describe(
      'The social media platforms the content is for (e.g., Facebook, Instagram, Twitter, LinkedIn, TikTok).'
    ),
  contentGoals: z
    .string()
    .describe(
      'The goals of the content (e.g., increase brand awareness, drive website traffic, generate leads).'
    ),
});

export type SocialStrategistIAInput = z.infer<typeof SocialStrategistIAInputSchema>;

const SocialStrategistIAOutputSchema = z.object({
  postIdeas: z
    .array(z.string())
    .describe('An array of creative and engaging social media post ideas.'),
  contentStrategy: z
    .string()
    .describe(
      'A comprehensive content strategy outlining themes, topics, and posting frequency.'
    ),
});

export type SocialStrategistIAOutput = z.infer<typeof SocialStrategistIAOutputSchema>;

export async function socialStrategistIA(input: SocialStrategistIAInput): Promise<SocialStrategistIAOutput> {
  return socialStrategistIAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socialStrategistIAPrompt',
  input: {schema: SocialStrategistIAInputSchema},
  output: {schema: SocialStrategistIAOutputSchema},
  prompt: `You are a social media strategist AI for Keyroz Digital Solutions, skilled in crafting engaging content.

  Based on the client's context, recent posts, platform preferences, and content goals, generate social media post ideas and a content strategy.

  Client Context: {{{clientContext}}}
  Recent Posts: {{{recentPosts}}}
  Desired Platforms: {{{desiredPlatforms}}}
  Content Goals: {{{contentGoals}}}

  Provide creative post ideas that are tailored to the client and platform, and create a content strategy that aligns with the client's goals.

  Ensure that the ideas and strategies are practical and actionable.

  Your output should be formatted as follows:

  Post Ideas:
  - [Post Idea 1]
  - [Post Idea 2]
  ...

  Content Strategy: [A detailed content strategy].`,
});

const socialStrategistIAFlow = ai.defineFlow(
  {
    name: 'socialStrategistIAFlow',
    inputSchema: SocialStrategistIAInputSchema,
    outputSchema: SocialStrategistIAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
