
'use server'

import {
  clientBrainstorming,
  type ClientBrainstormingInput,
  type ClientBrainstormingOutput,
} from '@/ai/flows/client-brainstorming';
import {
  createAgent,
  type CreateAgentInput,
  type CreateAgentOutput,
} from '@/ai/flows/ai-agent-management';
import {
  socialStrategistIA,
  type SocialStrategistIAInput,
  type SocialStrategistIAOutput,
} from '@/ai/flows/social-strategist-ia';
import {
  adsIACreator,
  type AdsIACreatorInput,
  type AdsIACreatorOutput,
} from '@/ai/flows/ads-ia-creator';
import { 
    prospectScraper,
    type ProspectScraperInput,
    type ProspectScraperOutput,
} from '@/ai/flows/prospect-scraper-flow';


export async function runClientBrainstorming(input: ClientBrainstormingInput): Promise<ClientBrainstormingOutput> {
    return await clientBrainstorming(input);
}

export async function runCreateAgent(input: CreateAgentInput): Promise<CreateAgentOutput> {
    return await createAgent(input);
}

export async function runSocialStrategist(input: SocialStrategistIAInput): Promise<SocialStrategistIAOutput> {
    return await socialStrategistIA(input);
}

export async function runAdsCreator(input: AdsIACreatorInput): Promise<AdsIACreatorOutput> {
    return await adsIACreator(input);
}

export async function runProspectScraper(input: ProspectScraperInput): Promise<ProspectScraperOutput> {
    return await prospectScraper(input);
}
