
'use client';
import { redirect } from 'next/navigation';

// This page just redirects to the first available tab in settings
export default function SettingsRootPage() {
    redirect('/settings/integrations');
}
