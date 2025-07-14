
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
    .describe('O contexto do cliente, incluindo ICP, CAC, FAQ, e qualquer outra informação relevante.'),
  advertisingGoal: z
    .string()
    .describe('O objetivo da publicidade, como aumentar brand awareness, gerar leads, ou driving sales.'),
  productOrService: z
    .string()
    .describe('O produto ou serviço sendo anunciado.'),
  platforms: z.string().describe('As plataformas onde os anúncios serão veiculados (ex: Google Ads, Meta Ads).'),
  campaignType: z.string().describe('O tipo de campanha (ex: Vendas, Leads, Tráfego no site).'),
  audiences: z.string().describe('Descrição dos públicos-alvo principais.'),
  interests: z.string().describe('Interesses, palavras-chave e comportamentos para segmentação.'),
  negativeKeywords: z.string().optional().describe('Palavras-chave ou públicos a serem negativados/excluídos.'),
  numCampaigns: z.number().describe('O número de campanhas para gerar.'),
  numAdSets: z.number().describe('O número de ad sets para gerar por campanha.'),
  numCreatives: z.number().describe('O número de criativos para gerar por ad set.'),
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
    creatives: z.array(CreativeSchema).describe('Uma lista de criativos para este conjunto de anúncios.')
});

const CampaignSchema = z.object({
    campaignName: z.string().describe('O nome da campanha (Ex: "Lançamento Produto X - Vendas").'),
    adSets: z.array(AdSetSchema).describe('Uma lista de conjuntos de anúncios para esta campanha.')
});

const AdsIACreatorOutputSchema = z.object({
  campaigns: z.array(CampaignSchema).describe('Uma lista de estruturas de campanha completas.'),
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
  prompt: `Você é um gestor de tráfego sênior e especialista em marketing digital na agência Keyroz Digital Solutions. Sua tarefa é criar uma estratégia de anúncios completa e robusta, respondendo inteiramente em português do Brasil.

**Contexto do Cliente:**
{{{clientContext}}}

**Detalhes da Campanha:**
- **Produto/Serviço a ser Anunciado:** {{{productOrService}}}
- **Objetivo Principal:** {{{advertisingGoal}}}
- **Plataformas:** {{{platforms}}}
- **Tipo de Campanha:** {{{campaignType}}}
- **Públicos-alvo:** {{{audiences}}}
- **Interesses/Palavras-chave:** {{{interests}}}
{{#if negativeKeywords}}- **Públicos/Palavras-chave a Negativar:** {{{negativeKeywords}}}{{/if}}

Com base nessas informações, gere uma estrutura detalhada de publicidade. Você deve criar **{{{numCampaigns}}} campanhas distintas**. Dentro de cada campanha, crie **{{{numAdSets}}} conjuntos de anúncios** com diferentes segmentações. Para cada conjunto de anúncios, desenvolva **{{{numCreatives}}} ideias de criativos**.

Para cada **criativo**, você deve fornecer:
- 3 opções de **títulos** persuasivos.
- 3 opções de **descrições** (corpo do anúncio).
- 3 opções de **CTAs** (Call to Action).
- 3 ideias distintas para a **imagem ou vídeo** do anúncio.

**IMPORTANTE: Ao final, você DEVE OBRIGATORIAMENTE fornecer os seguintes campos no JSON de saída:**
1.  **overallBudget**: Um objeto contendo uma sugestão de orçamento total (suggestion) e uma recomendação de alocação (allocation).
2.  **summary**: Um resumo estratégico conciso, explicando qual campanha você acredita que terá o melhor desempenho e por quê.

Seja criativo, estratégico e detalhado. Certifique-se de que sua resposta final siga estritamente o schema JSON de saída, incluindo todos os campos obrigatórios.
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
