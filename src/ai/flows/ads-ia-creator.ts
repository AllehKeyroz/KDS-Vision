'use server';

/**
 * @fileOverview AI-guided ad campaign creation flow.
 *
 * - adsIACreator - A function that handles the AI-guided ad campaign creation process.
 * - AdsIACreatorInput - The input type for the adsIACreator function.
 * - AdsIACreatorOutput - The return type for the adsIACreator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdsIACreatorInputSchema = z.object({
  clientContext: z
    .string()
    .describe('The context of the client, including ICP, CAC, FAQ, and any other relevant information.'),
  advertisingGoal: z
    .string()
    .describe('The advertising goal, such as increasing brand awareness, generating leads, or driving sales.'),
  productOrService: z
    .string()
    .describe('The product or service being advertised.'),
  targetAudience: z
    .string()
    .describe('A description of the target audience for the ad campaign.'),
});
export type AdsIACreatorInput = z.infer<typeof AdsIACreatorInputSchema>;

const AdsIACreatorOutputSchema = z.object({
  campaignStructure: z.object({
    campaignName: z.string().describe('The name of the campaign.'),
    adSets: z.array(
      z.object({
        adSetName: z.string().describe('The name of the ad set.'),
        targeting: z.string().describe('The targeting criteria for the ad set.'),
        budget: z.number().describe('The budget for the ad set.'),
        creatives: z.array(
          z.object({
            creativeName: z.string().describe('The name of the creative.'),
            copy: z.string().describe('The ad copy for the creative.'),
            description: z
              .string()
              .describe('A detailed description of the visual elements for the creative.'),
          })
        ),
      })
    ),
  }),
  budgetSuggestion: z.number().describe('A suggested budget for the entire campaign.'),
  budgetAllocation: z
    .string()
    .describe('A suggested allocation of the budget across the ad sets.'),
});
export type AdsIACreatorOutput = z.infer<typeof AdsIACreatorOutputSchema>;

export async function adsIACreator(input: AdsIACreatorInput): Promise<AdsIACreatorOutput> {
  return adsIACreatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adsIACreatorPrompt',
  input: {schema: AdsIACreatorInputSchema},
  output: {schema: AdsIACreatorOutputSchema},
  prompt: `You are an expert marketing strategist. Given the client's context, advertising goal, product/service, and target audience, generate a complete ad campaign structure, budget suggestions, and budget allocation.

Client Context: {{{clientContext}}}
Advertising Goal: {{{advertisingGoal}}}
Product/Service: {{{productOrService}}}
Target Audience: {{{targetAudience}}}

Based on this information, create an ad campaign structure with campaign name, ad sets (name, targeting, budget, creatives), a budget suggestion for the campaign, and a budget allocation across the ad sets. Provide detailed descriptions for the visual elements of each creative.
`,
});

const adsIACreatorFlow = ai.defineFlow(
  {
    name: 'adsIACreatorFlow',
    inputSchema: AdsIACreatorInputSchema,
    outputSchema: AdsIACreatorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
