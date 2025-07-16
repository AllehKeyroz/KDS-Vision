
'use server';

/**
 * @fileOverview A flow to interact with the Evolution API for WhatsApp management.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EvolutionInstance, EvolutionInstanceCreationResponse, GetQRCodeResponse, Chat, Message } from '@/lib/types';


// Helper to get API credentials from Firestore
async function getEvolutionCredentials(): Promise<{ apiUrl: string; apiKey: string }> {
    const docRef = doc(db, 'agency', 'internal', 'api_keys', 'evolution');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().apiUrl && docSnap.data().apiKey) {
        return {
            apiUrl: docSnap.data().apiUrl,
            apiKey: docSnap.data().apiKey,
        };
    } else {
        throw new Error('Evolution API URL ou API Key não encontrada. Adicione em Agência > Chaves de API.');
    }
}

// Helper to make API calls with robust error handling and logging
async function callEvolutionApi(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body?: object) {
    const { apiUrl, apiKey } = await getEvolutionCredentials();
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const url = `${cleanApiUrl}${endpoint}`;
    
    console.log(`[Evolution API] Calling: ${method} ${url}`);
    if (body) {
        console.log(`[Evolution API] Body: ${JSON.stringify(body)}`);
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
            },
            ...(body && { body: JSON.stringify(body) }),
        });

        // Always try to get text first for better error logging
        const responseText = await response.text();
        
        if (!response.ok) {
            console.error(`[Evolution API] Error Response Text for ${url}:`, responseText);
            let errorBody;
            try {
                // Try parsing error as JSON
                errorBody = JSON.parse(responseText);
            } catch (e) {
                // If not JSON, use the raw text
                errorBody = { message: responseText || 'An unknown error occurred.' };
            }
            
            // Attempt to extract a meaningful message from the error object
            const errorMessage = errorBody?.message || (Array.isArray(errorBody?.response?.message) ? errorBody.response.message.join(', ') : errorBody?.response?.message) || JSON.stringify(errorBody);
            throw new Error(`Evolution API Error (${response.status}): ${errorMessage}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1 && responseText) {
             return JSON.parse(responseText);
        } else {
            // Return raw text if not JSON, might be useful for some endpoints
            return responseText;
        }
    } catch (error) {
        console.error(`[Evolution API] Fatal Error calling endpoint ${endpoint}:`, error);
        if (error instanceof Error) {
            // Re-throw the error to be caught by the calling function
            throw error;
        }
        throw new Error('An unknown error occurred during the API call.');
    }
}


// --- Create Instance Flow ---
const CreateInstanceInputSchema = z.object({
  instanceName: z.string().describe('The name for the new WhatsApp instance.'),
});
type CreateInstanceInput = z.infer<typeof CreateInstanceInputSchema>;

const createEvolutionInstanceFlow = ai.defineFlow(
    {
        name: 'createEvolutionInstanceFlow',
        inputSchema: CreateInstanceInputSchema,
        outputSchema: z.any(),
    },
    async ({ instanceName }) => {
        return await callEvolutionApi('/instance/create', 'POST', {
            instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        });
    }
);

export async function createEvolutionInstance(input: CreateInstanceInput): Promise<EvolutionInstanceCreationResponse> {
    return await createEvolutionInstanceFlow(input);
}


// --- Fetch Instances Flow ---
const fetchEvolutionInstancesFlow = ai.defineFlow(
    {
        name: 'fetchEvolutionInstancesFlow',
        inputSchema: z.void(),
        outputSchema: z.array(z.any()), // Expect an array of instances
    },
    async () => {
        try {
            const result = await callEvolutionApi('/instance/fetchInstances', 'GET');
            return Array.isArray(result) ? result : [];
        } catch (error) {
             console.error("[Evolution API] Failed to fetch instances in flow, returning empty array.", error);
             return []; // Return empty array on failure to prevent crashes
        }
    }
);

export async function fetchEvolutionInstances(): Promise<EvolutionInstance[]> {
    return await fetchEvolutionInstancesFlow();
}

// --- Get Instance QR Code Flow ---
const GetInstanceQRInputSchema = z.string();

const getEvolutionInstanceQRFlow = ai.defineFlow(
    {
        name: 'getEvolutionInstanceQRFlow',
        inputSchema: GetInstanceQRInputSchema,
        outputSchema: z.any(),
    },
    async (instanceName) => {
        const result = await callEvolutionApi(`/instance/connect/${instanceName}`, 'GET');
        return result;
    }
);

export async function getEvolutionInstanceQR(instanceName: string): Promise<GetQRCodeResponse> {
    return await getEvolutionInstanceQRFlow(instanceName);
}


// --- Fetch Chats Flow ---
const FetchChatsInputSchema = z.string();

const fetchChatsFlow = ai.defineFlow(
    {
        name: 'fetchChatsFlow',
        inputSchema: FetchChatsInputSchema,
        outputSchema: z.array(z.any()),
    },
    async (instanceName) => {
        try {
            const result = await callEvolutionApi(`/chat/find-all/${instanceName}`, 'GET');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error(`[Evolution API] Failed to fetch chats for ${instanceName}:`, error);
            return [];
        }
    }
);

export async function fetchChats(instanceName: string): Promise<Chat[]> {
    return await fetchChatsFlow(instanceName);
}


// --- Fetch Messages Flow ---
const FetchMessagesInputSchema = z.object({
    instanceName: z.string(),
    jid: z.string(), // The contact or group ID
});
type FetchMessagesInput = z.infer<typeof FetchMessagesInputSchema>;

const fetchMessagesFlow = ai.defineFlow(
    {
        name: 'fetchMessagesFlow',
        inputSchema: FetchMessagesInputSchema,
        outputSchema: z.array(z.any()),
    },
    async ({ instanceName, jid }) => {
        try {
            const result = await callEvolutionApi(`/chat/find-messages/${instanceName}`, 'POST', {
                jid,
            });
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error(`[Evolution API] Failed to fetch messages for ${jid} in ${instanceName}:`, error);
            return [];
        }
    }
);

export async function fetchMessages(input: FetchMessagesInput): Promise<Message[]> {
    return await fetchMessagesFlow(input);
}
