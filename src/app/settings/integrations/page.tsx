
'use client';
import { redirect } from 'next/navigation';

// This page just redirects to the first available tab in integrations
export default function IntegrationsRootPage() {
    redirect('/settings/integrations/keys');
}
