
'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, where, getDocs, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { User as AppUser, Invitation } from '@/lib/types';

interface AuthContextType {
    user: AppUser | null;
    firebaseUser: FirebaseUser | null;
    isLoading: boolean;
    signOut: () => void;
    signInWithEmail: (email: string, password: string) => Promise<any>;
    signInWithGoogle: () => Promise<any>;
    signUp: (name: string, email: string, password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const agencyAdminEmail = 'alleh.keyroz@gmail.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setIsLoading(true);
            if (fbUser) {
                setFirebaseUser(fbUser);
                const userDocRef = doc(db, 'users', fbUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setUser({ id: userDocSnap.id, ...userDocSnap.data() } as AppUser);
                } else {
                    // Handle case where user is authenticated but not in Firestore
                    // This could happen on first sign-up
                    // We let the signUp function handle creating the user doc
                }
            } else {
                setFirebaseUser(null);
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const isAuthPage = pathname === '/login' || pathname === '/signup';

        if (!user && !isAuthPage) {
            router.push('/login');
        } else if (user && isAuthPage) {
            router.push('/');
        }
    }, [user, isLoading, pathname, router]);


    const createUserInFirestore = async (fbUser: FirebaseUser, name: string, role: AppUser['role'], assignedClientIds?: string[]) => {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const newUser: Omit<AppUser, 'id'> = {
            name: name,
            email: fbUser.email || '',
            role: role,
            assignedClientIds: assignedClientIds || [],
            avatar: fbUser.photoURL || `https://placehold.co/64x64/EBF4FF/2E9AFE.png?text=${(name)[0] || 'U'}`,
        };
        await setDoc(userDocRef, newUser);
        setUser({ id: fbUser.uid, ...newUser });
        return newUser;
    };
    
    const signUp = async (name: string, email: string, password: string) => {
        const normalizedEmail = email.toLowerCase();
        
        // Special case for agency admin
        if (normalizedEmail === agencyAdminEmail) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
                await createUserInFirestore(userCredential.user, name, 'agencyAdmin');
                router.push('/');
            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    throw new Error('Este e-mail de administrador já está cadastrado. Faça o login.');
                }
                throw error;
            }
            return;
        }

        const invitationsRef = collection(db, "invitations");
        const q = query(invitationsRef, where("email", "==", normalizedEmail), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Seu e-mail não foi encontrado na lista de convites. Fale com o administrador.");
        }

        const invitationDoc = querySnapshot.docs[0];
        const invitation = invitationDoc.data() as Invitation;
        
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await createUserInFirestore(userCredential.user, name, invitation.role, [invitation.clientId]);
        
        // Update invitation status
        const batch = writeBatch(db);
        batch.update(invitationDoc.ref, { status: "accepted" });
        await batch.commit();

        router.push('/');
    };

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the rest
    };
    
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
             // If user doesn't exist in Firestore, check for invitation
             const normalizedEmail = fbUser.email!.toLowerCase();
             
             if (normalizedEmail === agencyAdminEmail) {
                 await createUserInFirestore(fbUser, fbUser.displayName || 'Admin', 'agencyAdmin');
                 router.push('/');
                 return;
             }

             const invitationsRef = collection(db, "invitations");
             const q = query(invitationsRef, where("email", "==", normalizedEmail), where("status", "==", "pending"));
             const querySnapshot = await getDocs(q);

             if (querySnapshot.empty) {
                 await firebaseSignOut(auth);
                 throw new Error("Acesso não autorizado. Você precisa de um convite para criar uma conta.");
             }
             
             const invitationDoc = querySnapshot.docs[0];
             const invitation = invitationDoc.data() as Invitation;
             
             await createUserInFirestore(fbUser, fbUser.displayName || 'Usuário', invitation.role, [invitation.clientId]);
        
             const batch = writeBatch(db);
             batch.update(invitationDoc.ref, { status: "accepted" });
             await batch.commit();
        }
         // onAuthStateChanged will handle the rest
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, isLoading, signOut, signInWithEmail, signInWithGoogle, signUp }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
