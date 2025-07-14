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


const CreativeSchema = z.object({
    creativeName: z.string().describe('O nome do criativo (Ex: "Vídeo Demonstração Rápida").'),
    titles: z.array(z.string()).describe('Uma lista de 3 títulos (headlines) para o anúncio.'),
    descriptions: z.array(z.string()).describe('Uma lista de 3 descrições para o corpo do anúncio.'),
    ctas: z.array(z.string()).describe('Uma lista de 3 chamadas para ação (call-to-actions), como "Compre Agora" ou "Saiba Mais".'),
    imageIdeas: z.array(z.string()).describe('Uma lista de 3 ideias de visuais para o criativo (descreva a imagem ou vídeo).')
});

const AdSetSchema = z.object({
    adSetName: z.string().describe('O nome do conjunto de anúncios (Ex: "Público Frio - Interesses").'),
    targeting: z.string().describe('Os critérios de direcionamento para este conjunto (público, idade, interesses).'),
    budget: z.number().describe('O orçamento diário ou vitalício sugerido para este conjunto.'),
    creatives: z.array(CreativeSchema).describe('Uma lista de 5 criativos para este conjunto de anúncios.')
});

const CampaignSchema = z.object({
    campaignName: z.string().describe('O nome da campanha (Ex: "Lançamento Produto X - Vendas").'),
    adSets: z.array(AdSetSchema).describe('Uma lista de 3 conjuntos de anúncios para esta campanha.')
});

const AdsIACreatorOutputSchema = z.object({
  campaigns: z.array(CampaignSchema).describe('Uma lista de 3 estruturas de campanha completas.'),
  overallBudget: z.object({
      suggestion: z.number().describe('Uma sugestão de orçamento total para todas as campanhas.'),
      allocation: z.string().describe('Uma recomendação de como alocar o orçamento entre as campanhas.'),
  }),
  summary: z.string().describe('Um breve resumo da estratégia geral e qual campanha tem maior potencial de sucesso e porquê.')
});
export type AdsIACreatorOutput = z.infer<typeof AdsIACreatorOutputSchema>;

export async function adsIACreator(input: AdsIACreatorInput): Promise<AdsIACreatorOutput> {
  return adsIACreatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adsIACreatorPrompt',
  input: {schema: AdsIACreatorInputSchema},
  output: {schema: AdsIACreatorOutputSchema},
  prompt: `Você é um especialista em marketing e tráfego pago. Sua tarefa é criar uma estratégia de anúncios completa e robusta para um cliente da agência Keyroz Digital Solutions. Responda inteiramente em português do Brasil.

**Contexto do Cliente:**
{{{clientContext}}}

**Objetivo da Publicidade:**
{{{advertisingGoal}}}

**Produto/Serviço a ser Anunciado:**
{{{productOrService}}}

**Público-alvo:**
{{{targetAudience}}}

Com base nessas informações, gere uma estrutura detalhada de publicidade. Você deve criar **3 campanhas distintas**, cada uma com um ângulo ou objetivo ligeiramente diferente. Dentro de cada campanha, crie **3 conjuntos de anúncios** com diferentes segmentações de público. Para cada conjunto de anúncios, desenvolva **5 ideias de criativos**.

Para cada **criativo**, você deve fornecer:
- 3 opções de **títulos** persuasivos.
- 3 opções de **descrições** (corpo do anúncio).
- 3 opções de **CTAs** (Call to Action).
- 3 ideias distintas para a **imagem ou vídeo** do anúncio.

Finalmente, forneça uma sugestão de **orçamento geral** com uma recomendação de alocação e um **resumo estratégico**, explicando qual campanha você acredita que terá o melhor desempenho e por quê. Seja criativo, estratégico e detalhado.
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
