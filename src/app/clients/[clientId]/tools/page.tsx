
'use client'

import React from 'react';
import { Megaphone, Share2, Lightbulb, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdsCreatorPage from '../ads/page';
import SocialStrategistPage from '../social/page';
import BrainstormingPage from '../brainstorming/page';
import AgentsPage from '../agents/page';

export default function ToolsPage() {

    return (
        <Tabs defaultValue="ads" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="ads" className="flex items-center gap-2"><Megaphone className="h-4 w-4"/>Ads Creator</TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-2"><Share2 className="h-4 w-4"/>Social Strategist</TabsTrigger>
                <TabsTrigger value="brainstorming" className="flex items-center gap-2"><Lightbulb className="h-4 w-4"/>Brainstorming IA</TabsTrigger>
                <TabsTrigger value="agents" className="flex items-center gap-2"><Bot className="h-4 w-4"/>Agentes IA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ads">
                <AdsCreatorPage />
            </TabsContent>

            <TabsContent value="social">
                <SocialStrategistPage />
            </TabsContent>
            
            <TabsContent value="brainstorming">
                <BrainstormingPage />
            </TabsContent>

            <TabsContent value="agents">
                <AgentsPage />
            </TabsContent>
        </Tabs>
    );
}
