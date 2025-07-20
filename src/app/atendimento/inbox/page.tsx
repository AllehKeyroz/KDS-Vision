
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { runFetchEvolutionInstances, runFetchChats, runFetchMessages } from '@/app/actions';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Inbox, Server, MessageSquare, Send, RefreshCw, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EvolutionInstance, Chat, Message } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

export default function InboxPage() {
    const { toast } = useToast();
    const [instances, setInstances] = useState<EvolutionInstance[]>([]);
    const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const [isLoadingInstances, setIsLoadingInstances] = useState(true);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    
    const [isInstancePopoverOpen, setIsInstancePopoverOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchInstances = useCallback(async () => {
        setIsLoadingInstances(true);
        try {
            const result = await runFetchEvolutionInstances();
            const connectedInstances = result.filter(
                (inst) => inst && (inst.connectionStatus === 'open' || inst.connectionStatus === 'connected')
            );
            setInstances(connectedInstances);
            // Auto-select the first instance if none are selected
            if (connectedInstances.length > 0 && selectedInstances.length === 0) {
                setSelectedInstances([connectedInstances[0].name]);
            }
        } catch (error) {
            toast({
                title: 'Erro ao buscar instâncias',
                description: (error as Error).message,
                variant: 'destructive',
            });
        } finally {
            setIsLoadingInstances(false);
        }
    }, [toast, selectedInstances.length]);

    useEffect(() => {
        fetchInstances();
    }, []);

    useEffect(() => {
        if (selectedInstances.length === 0) {
            setChats([]);
            return;
        }

        const fetchAllChats = async () => {
            setIsLoadingChats(true);
            setSelectedChat(null);
            setMessages([]);
            try {
                const chatPromises = selectedInstances.map(instanceName => runFetchChats(instanceName).then(chats => chats.map(c => ({...c, instanceName}))));
                const results = await Promise.all(chatPromises);
                const allChats = results.flat();

                const sortedChats = allChats.sort((a, b) => (b.lastMessage?.messageTimestamp || 0) - (a.lastMessage?.messageTimestamp || 0));
                setChats(sortedChats);
            } catch (error) {
                toast({
                    title: 'Erro ao buscar conversas',
                    description: (error as Error).message,
                    variant: 'destructive',
                });
            } finally {
                setIsLoadingChats(false);
            }
        };

        fetchAllChats();
    }, [selectedInstances, toast]);

    useEffect(() => {
        if (!selectedChat || !selectedChat.instanceName) {
            setMessages([]);
            return;
        }

        const fetchChatMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const result = await runFetchMessages({ instanceName: selectedChat.instanceName!, jid: selectedChat.jid });
                const sortedMessages = result.sort((a,b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));
                setMessages(sortedMessages);
            } catch (error) {
                 toast({
                    title: 'Erro ao buscar mensagens',
                    description: (error as Error).message,
                    variant: 'destructive',
                });
            } finally {
                setIsLoadingMessages(false);
            }
        };
        
        fetchChatMessages();

    }, [selectedChat, toast]);


    const formatTimestamp = (timestamp: number) => {
        if (!timestamp) return '';
        return format(new Date(timestamp * 1000), 'HH:mm');
    };
    
    const getMessageText = (message: Message) => {
        return message.message.conversation || message.message.extendedTextMessage?.text || '[Mídia ou mensagem não suportada]';
    };

    return (
        <Card className="h-[calc(100vh-14rem)] w-full flex">
            {/* Sidebar com a lista de chats */}
            <div className="w-full md:w-[380px] border-r flex flex-col">
                <div className="p-4 border-b space-y-4">
                    <h2 className="text-xl font-bold">Caixa de Entrada</h2>
                    <div className="flex gap-2 items-center">
                        <Popover open={isInstancePopoverOpen} onOpenChange={setIsInstancePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isInstancePopoverOpen}
                                className="w-full justify-between"
                                disabled={isLoadingInstances}
                                >
                                {selectedInstances.length > 0 ? `${selectedInstances.length} selecionada(s)` : "Selecione a(s) instância(s)"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar instância..." />
                                    <CommandEmpty>Nenhuma instância conectada.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandList>
                                        {instances.map((instance) => (
                                            <CommandItem
                                            key={instance.id}
                                            value={instance.name}
                                            onSelect={(currentValue) => {
                                                setSelectedInstances(
                                                    selectedInstances.includes(currentValue)
                                                    ? selectedInstances.filter((name) => name !== currentValue)
                                                    : [...selectedInstances, currentValue]
                                                );
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedInstances.includes(instance.name) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {instance.name}
                                            </CommandItem>
                                        ))}
                                        </CommandList>
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button variant="ghost" size="icon" onClick={() => fetchInstances()} disabled={isLoadingInstances}>
                            <RefreshCw className={cn("h-4 w-4", isLoadingInstances && "animate-spin")} />
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {isLoadingChats ? (
                         <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin h-8 w-8" />
                        </div>
                    ) : chats.length > 0 ? (
                        chats.map((chat) => (
                            <div
                                key={`${chat.instanceName}-${chat.jid}`}
                                onClick={() => setSelectedChat(chat)}
                                className={cn(
                                    "flex items-center gap-4 p-4 cursor-pointer hover:bg-accent",
                                    selectedChat?.jid === chat.jid && "bg-accent"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${chat.name || chat.jid.split('@')[0]}&background=random`} data-ai-hint="avatar person" />
                                    <AvatarFallback>{(chat.name || 'C')[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold truncate">{chat.name || chat.jid.split('@')[0]}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTimestamp(chat.lastMessage?.messageTimestamp || 0)}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                         <p className="text-sm text-muted-foreground truncate">
                                            {chat.lastMessage?.message?.conversation || '[Mídia]'}
                                        </p>
                                        {selectedInstances.length > 1 && <Badge variant="secondary" className="text-xs">{chat.instanceName}</Badge>}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground p-8 flex flex-col items-center justify-center h-full">
                           <Inbox className="mx-auto h-10 w-10 mb-2"/>
                           <p>Nenhuma conversa encontrada</p>
                           <p className="text-xs">para as instâncias selecionadas.</p>
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Painel principal de mensagens */}
            <div className="hidden md:flex flex-1 flex-col bg-secondary/20">
                {selectedChat ? (
                    <>
                     <div className="p-4 border-b flex items-center gap-4 bg-background shadow-sm">
                         <Avatar>
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${selectedChat.name || selectedChat.jid.split('@')[0]}&background=random`} data-ai-hint="avatar person" />
                            <AvatarFallback>{(selectedChat.name || 'C')[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold">{selectedChat.name || selectedChat.jid.split('@')[0]}</h3>
                            <p className="text-xs text-muted-foreground">{selectedChat.jid}</p>
                        </div>
                     </div>

                     <ScrollArea className="flex-1 p-4 bg-repeat bg-center" style={{backgroundImage: "url('/whatsapp-bg.png')", backgroundSize: "300px"}}>
                        <div className="flex-1 space-y-4">
                            {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>
                            ) : (
                                <>
                                {messages.map((msg, index) => (
                                    <div key={index} className={cn("flex", msg.key.fromMe ? "justify-end" : "justify-start")}>
                                        <div className={cn("max-w-xs md:max-w-md lg:max-w-xl p-3 rounded-lg shadow", msg.key.fromMe ? "bg-primary text-primary-foreground" : "bg-background")}>
                                            <p className="text-sm">{getMessageText(msg)}</p>
                                            <p className="text-xs text-right mt-1 opacity-70">{formatTimestamp(msg.messageTimestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                     </ScrollArea>
                     
                     <div className="p-4 border-t bg-background">
                        <div className="flex items-center gap-2">
                            <Input placeholder="Digite sua mensagem..." className="bg-secondary border-0 focus-visible:ring-1"/>
                            <Button><Send className="h-4 w-4" /></Button>
                        </div>
                     </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-repeat bg-center" style={{backgroundImage: "url('/whatsapp-bg.png')", backgroundSize: "300px"}}>
                        <MessageSquare className="mx-auto h-16 w-16 mb-4" />
                        <h2 className="text-xl font-bold">Selecione uma conversa</h2>
                        <p>Escolha uma conversa da lista à esquerda para ver as mensagens.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
