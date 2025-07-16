
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
import { doc, getDoc, setDoc, query, where, getDocs, collection, writeBatch, serverTimestamp, onSnapshot } from 'firebase/firestore';
import type { User as AppUser, Invitation, Client } from '@/lib/types';

type ViewContext = { type: 'agency' } | { type: 'client', clientId: string, clientName: string };

interface AuthContextType {
    user: AppUser | null;
    firebaseUser: FirebaseUser | null;
    isLoading: boolean;
    clients: Client[];
    viewContext: ViewContext;
    setViewContext: (context: {type: 'agency'} | {type: 'client', client: Client}) => void;
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
    const [clients, setClients] = useState<Client[]>([]);
    const [viewContext, setViewContextState] = useState<ViewContext>({ type: 'agency' });
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
                    const appUser = { id: userDocSnap.id, ...userDocSnap.data() } as AppUser;
                    setUser(appUser);
                    // Set initial context based on user role
                    if (appUser.role !== 'agencyAdmin' && appUser.assignedClientIds && appUser.assignedClientIds.length > 0) {
                        const firstClient = clients.find(c => c.id === appUser.assignedClientIds![0]);
                        if(firstClient) {
                           setViewContextState({ type: 'client', clientId: firstClient.id, clientName: firstClient.name });
                        }
                    } else {
                        setViewContextState({ type: 'agency' });
                    }
                } else {
                    // This can happen on first sign-up
                }
            } else {
                setFirebaseUser(null);
                setUser(null);
            }
            setIsLoading(false);
        });
        
        const clientsQuery = query(collection(db, 'clients'));
        const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        });

        return () => {
          unsubscribe();
          unsubscribeClients();
        };
    }, []);
    
    useEffect(() => {
      if (user && user.role !== 'agencyAdmin' && user.assignedClientIds && user.assignedClientIds.length > 0) {
        const firstClientId = user.assignedClientIds[0];
        const client = clients.find(c => c.id === firstClientId);
        if (client && viewContext.type === 'agency') { // Only set if not already on a client view
            setViewContextState({ type: 'client', clientId: client.id, clientName: client.name });
        }
      }
    }, [user, clients, viewContext.type]);


    useEffect(() => {
        if (isLoading) return;

        const isAuthPage = pathname === '/login' || pathname === '/signup';

        if (!user && !isAuthPage) {
            router.push('/login');
        } else if (user && isAuthPage) {
            router.push('/');
        }
    }, [user, isLoading, pathname, router]);

    const setViewContext = (context: {type: 'agency'} | {type: 'client', client: Client}) => {
        if (context.type === 'agency') {
            setViewContextState({ type: 'agency' });
            router.push('/');
        } else {
            setViewContextState({ type: 'client', clientId: context.client.id, clientName: context.client.name });
            router.push(`/clients/${context.client.id}`);
        }
    }


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
        
        const batch = writeBatch(db);
        batch.update(invitationDoc.ref, { status: "accepted" });
        await batch.commit();

        router.push('/');
    };

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };
    
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
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
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, isLoading, clients, viewContext, setViewContext, signOut, signInWithEmail, signInWithGoogle, signUp }}>
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
