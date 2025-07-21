'use server';
/**
 * @fileOverview A flow to scrape prospect data from Google Maps using Outscraper API.
 *
 * - prospectScraper - A function that scrapes prospect data based on a query.
 * - ProspectScraperInput - The input type for the prospectScraper function.
 * - ProspectScraperOutput - The return type for the prospectScraper function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ProspectScraperInputSchema = z.object({
  query: z.string().describe('The search query for prospects (e.g., "restaurants in New York").'),
  limit: z.number().describe('The number of prospects to scrape.')
});
export type ProspectScraperInput = z.infer<typeof ProspectScraperInputSchema>;

const ScrapedProspectSchema = z.object({
    name: z.string().describe("The name of the business."),
    address: z.string().describe("The formatted address of the business."),
    rating: z.number().optional().describe("The user rating of the business."),
    contact: z.string().describe("Primary contact info (website or phone)."),
});

const ProspectScraperOutputSchema = z.array(ScrapedProspectSchema);
export type ProspectScraperOutput = z.infer<typeof ProspectScraperOutputSchema>;

async function getOutscraperApiKey(): Promise<string> {
    const docRef = doc(db, 'agency', 'internal', 'api_keys', 'outscraper');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().key) {
        return docSnap.data().key;
    } else {
        throw new Error('Outscraper API key not found. Please add it in the Agency panel.');
    }
}

export async function prospectScraper(input: ProspectScraperInput): Promise<ProspectScraperOutput> {
    return prospectScraperFlow(input);
}

const prospectScraperFlow = ai.defineFlow(
  {
    name: 'prospectScraperFlow',
    inputSchema: ProspectScraperInputSchema,
    outputSchema: ProspectScraperOutputSchema,
  },
  async ({ query, limit }) => {
    const apiKey = await getOutscraperApiKey();
    
    // The query should be an array of search terms
    const url = new URL('https://api.outscraper.com/maps/search-v2');
    url.searchParams.append('query', JSON.stringify([query]));
    url.searchParams.append('limit', String(limit));
    url.searchParams.append('async', 'false'); // Use synchronous call for immediate results

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey
            }
        });

        const result = await response.json();
        
        if (response.status !== 200 || !result.data || !Array.isArray(result.data)) {
             throw new Error(`Outscraper API error: ${result.message || 'An error occurred or invalid data format returned.'}`);
        }

        // The data is an array of results, potentially nested if multiple queries were sent.
        const businesses = (result.data[0] || []).map((item: any) => ({
            name: item.name || item.query || 'N/A', // CORRECTED: Prioritize the actual business name
            address: item.full_address || 'N/A',
            rating: item.rating || undefined,
            contact: item.site_url || item.phone || 'N/A', 
        }));
        
        return businesses;

    } catch (error) {
        console.error("Error calling Outscraper API:", error);
        throw error;
    }
  }
);
