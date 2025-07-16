
'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
    uid: string;
    email: string;
    name: string;
    role: 'agencyAdmin' | 'clientAdmin' | 'user';
    assignedClientIds?: string[];
}

interface AuthContextType {
    authUser: FirebaseUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInWithEmail: (email: string, pass: string) => Promise<any>;
    signInWithGoogle: () => Promise<any>;
    signUpWithEmail: (name: string, email: string, pass: string) => Promise<any>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
    authUser: null,
    userProfile: null,
    loading: true,
    signInWithEmail: async () => {},
    signInWithGoogle: async () => {},
    signUpWithEmail: async () => {},
    signOut: () => {},
});

const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            if (user) {
                setAuthUser(user);
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data() as UserProfile);
                }
                if (publicRoutes.includes(pathname)) {
                    router.push('/');
                }
            } else {
                setAuthUser(null);
                setUserProfile(null);
                if (!publicRoutes.includes(pathname)) {
                    router.push('/login');
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, router]);


    const signOut = () => {
        firebaseSignOut(auth).then(() => {
            setAuthUser(null);
            setUserProfile(null);
            router.push('/login');
        });
    };

    const signInWithEmail = async (email: string, pass: string) => {
        return signInWithEmailAndPassword(auth, email, pass);
    };
    
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // Create user profile if it doesn't exist (e.g., first login with Google)
        if (!userDoc.exists()) {
             const role = user.email === 'alleh.keyroz@gmail.com' ? 'agencyAdmin' : 'user';
            
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                role: role,
                createdAt: serverTimestamp(),
            });
        }
    };

     const signUpWithEmail = async (name: string, email: string, pass: string) => {
        if (email.toLowerCase() === 'alleh.keyroz@gmail.com') {
             const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
             const user = userCredential.user;
             const userDocRef = doc(db, 'users', user.uid);
             await setDoc(userDocRef, {
                 uid: user.uid,
                 name,
                 email,
                 role: 'agencyAdmin',
                 costPerHour: 150, 
                 avatar: `https://placehold.co/64x64/EBF4FF/2E9AFE.png?text=${name[0] || 'A'}`,
                 createdAt: serverTimestamp(),
             });
             await sendEmailVerification(user);
             return;
        }
        
        throw new Error('invitation-not-found');
    };

    const value: AuthContextType = {
        authUser,
        userProfile,
        loading,
        signInWithEmail,
        signInWithGoogle,
        signUpWithEmail,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
