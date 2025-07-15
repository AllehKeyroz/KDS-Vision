'use server';
/**
 * @fileOverview A flow to scrape prospect data from Google Maps using Outscraper.
 *
 * - prospectScraper - A function that scrapes prospect data based on a query and limit.
 * - ProspectScraperInput - The input type for the prospectScraper function.
 * - ProspectScraperOutput - The return type for the prospectScraper function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Input Schema
const ProspectScraperInputSchema = z.object({
  query: z.string().describe('The search query for prospects (e.g., "restaurants in New York").'),
  limit: z.number().int().min(1).max(100).describe('The number of prospects to scrape.'),
});
export type ProspectScraperInput = z.infer<typeof ProspectScraperInputSchema>;

// Output Schema
const ScrapedProspectSchema = z.object({
    name: z.string().describe("The name of the business."),
    contact: z.string().describe("The primary contact information (phone or email)."),
    phones: z.string().optional().describe("The phone number(s) of the business."),
    emails: z.string().optional().describe("The email address(es) of the business."),
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
    const headers = {
        'X-API-KEY': apiKey,
    };
    
    // Using the Google Maps Scraper endpoint from Outscraper
    const url = new URL('https://api.outscraper.com/maps/search');
    url.searchParams.append('query', query);
    url.searchParams.append('limit', String(limit));
    url.searchParams.append('async', 'false'); // Ensures synchronous response

    try {
        const response = await fetch(url.toString(), { headers });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Outscraper API error: ${errorBody.message || response.statusText}`);
        }

        const result = await response.json();

        // The data is nested under a 'data' array, and each of those has a results array
        const businesses = result.data.flat().map((item: any) => ({
            name: item.name || 'N/A',
            contact: item.phones?.[0] || item.emails?.[0] || 'N/A',
            phones: item.phones?.join(', ') || undefined,
            emails: item.emails?.join(', ') || undefined,
        }));
        
        return businesses;

    } catch (error) {
        console.error("Error calling Outscraper API:", error);
        throw error; // Re-throw the error to be caught by the client
    }
  }
);
