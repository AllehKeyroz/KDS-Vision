'use server';
/**
 * @fileOverview A flow to scrape prospect data from Google Maps using Google Places API.
 *
 * - prospectScraper - A function that scrapes prospect data based on a query.
 * - ProspectScraperInput - The input type for the prospectScraper function.
 * - ProspectScraperOutput - The return type for the prospectScraper function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Input Schema - limit is removed as Google API has its own pagination
const ProspectScraperInputSchema = z.object({
  query: z.string().describe('The search query for prospects (e.g., "restaurants in New York").'),
});
export type ProspectScraperInput = z.infer<typeof ProspectScraperInputSchema>;

// Output Schema - Adjusted for Google Places API response
const ScrapedProspectSchema = z.object({
    name: z.string().describe("The name of the business."),
    address: z.string().describe("The formatted address of the business."),
    rating: z.number().optional().describe("The user rating of the business."),
    contact: z.string().describe("Primary contact info (website or phone)."), // a more generic contact field
});

const ProspectScraperOutputSchema = z.array(ScrapedProspectSchema);
export type ProspectScraperOutput = z.infer<typeof ProspectScraperOutputSchema>;


async function getGoogleMapsApiKey(): Promise<string> {
    const docRef = doc(db, 'agency', 'internal', 'api_keys', 'google_maps');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().key) {
        return docSnap.data().key;
    } else {
        throw new Error('Google Maps API key not found. Please add it in the Agency panel.');
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
  async ({ query }) => {
    const apiKey = await getGoogleMapsApiKey();
    
    // Using the Google Places API - Text Search
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('language', 'pt-BR'); // Optional: get results in Brazilian Portuguese

    try {
        const response = await fetch(url.toString());
        const result = await response.json();

        if (result.status !== 'OK') {
             throw new Error(`Google Places API error: ${result.status} - ${result.error_message || 'An error occurred.'}`);
        }

        // The data is in the 'results' array
        const businesses = result.results.map((item: any) => ({
            name: item.name || 'N/A',
            address: item.formatted_address || 'N/A',
            rating: item.rating || undefined,
            // Google Places API doesn't provide email. We can try to get website or phone.
            // A full implementation might fetch Place Details for more info, but that's a separate, more expensive call.
            contact: item.website || item.formatted_phone_number || 'N/A', 
        }));
        
        return businesses;

    } catch (error) {
        console.error("Error calling Google Places API:", error);
        throw error; // Re-throw the error to be caught by the client
    }
  }
);
