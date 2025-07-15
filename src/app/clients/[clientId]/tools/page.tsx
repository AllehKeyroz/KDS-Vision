
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="ads"><Megaphone className="mr-2"/>Ads Creator</TabsTrigger>
                <TabsTrigger value="social"><Share2 className="mr-2"/>Social Strategist</TabsTrigger>
                <TabsTrigger value="brainstorming"><Lightbulb className="mr-2"/>Brainstorming IA</TabsTrigger>
                <TabsTrigger value="agents"><Bot className="mr-2"/>Agentes IA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ads" className="mt-6">
                <AdsCreatorPage />
            </TabsContent>

            <TabsContent value="social" className="mt-6">
                <SocialStrategistPage />
            </TabsContent>
            
            <TabsContent value="brainstorming" className="mt-6">
                <BrainstormingPage />
            </TabsContent>

            <TabsContent value="agents" className="mt-6">
                <AgentsPage />
            </TabsContent>
        </Tabs>
    );
}
