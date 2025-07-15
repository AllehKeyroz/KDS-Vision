
'use client'
import { redirect } from 'next/navigation'

// This page just redirects to the first available tab, which is /agency/access
export default function AgencyRootPage() {
    redirect('/agency/access')
}
