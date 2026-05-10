"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createConversation,
  getApiErrorMessage,
  getConversationMessages,
  getCurrentUser,
  getMyConversations,
  markConversationAsRead,
  searchUsersForMessages,
  sendPrivateMessage,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { disconnectMessagesSocket, getMessagesSocket } from "@/lib/messages-socket";
import type {
  MessageParticipant,
  PrivateConversationMessagesResponse,
} from "@/lib/types";
import { privateConversationSchema, privateMessageSchema } from "@/lib/validators";

type NewConversationValues = z.input<typeof privateConversationSchema>;
type SendMessageValues = z.input<typeof privateMessageSchema>;
type ConversationDetails = PrivateConversationMessagesResponse;

export function MessagesShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore(
    (state) => state,
  );
  const participantIdParam = searchParams.get("participantId");
  const conversationIdParam = searchParams.get("conversationId");
  const autoCreateRef = useRef<string | null>(null);
  const autoReadRef = useRef<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<MessageParticipant | null>(null);
  const deferredRecipientSearch = useDeferredValue(recipientSearch.trim());

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });
  const currentUser = currentUserQuery.data?.user ?? user;

  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: getMyConversations,
    enabled: hydrated && Boolean(accessToken),
  });

  const conversations = useMemo(
    () => conversationsQuery.data?.conversations ?? [],
    [conversationsQuery.data?.conversations],
  );
  const selectedConversationId =
    conversations.find((conversation) => conversation.id === conversationIdParam)?.id ??
    conversations[0]?.id ??
    null;
  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  const messagesQuery = useQuery({
    queryKey: ["messages", "conversation", selectedConversationId],
    queryFn: () => getConversationMessages(selectedConversationId as string),
    enabled: hydrated && Boolean(accessToken) && Boolean(selectedConversationId),
  });

  const messages = messagesQuery.data?.messages ?? [];
  const activeRecipientSearch = selectedRecipient ? "" : deferredRecipientSearch;
  const recipientSearchQuery = useQuery({
    queryKey: ["users", "message-recipient-search", activeRecipientSearch],
    queryFn: () => searchUsersForMessages(activeRecipientSearch),
    enabled: hydrated && Boolean(accessToken) && activeRecipientSearch.length >= 2,
  });
  const recipientOptions = recipientSearchQuery.data?.users ?? [];

  const conversationForm = useForm<NewConversationValues>({
    resolver: zodResolver(privateConversationSchema),
    defaultValues: {
      participantId: participantIdParam ?? "",
      content: "",
    },
  });

  const messageForm = useForm<SendMessageValues>({
    resolver: zodResolver(privateMessageSchema),
    defaultValues: {
      content: "",
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (values: NewConversationValues) => {
      const result = await createConversation({
        participantId: values.participantId,
      });
      const firstMessage = values.content?.trim();

      if (firstMessage) {
        await sendPrivateMessage(result.conversation.id, {
          content: firstMessage,
        });
      }

      return result.conversation.id;
    },
    onSuccess: async (conversationId) => {
      conversationForm.reset({
        participantId: "",
        content: "",
      });
      setRecipientSearch("");
      setSelectedRecipient(null);
      router.replace(`/messages?conversationId=${conversationId}`);
      await queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      await queryClient.invalidateQueries({
        queryKey: ["messages", "conversation", conversationId],
      });
    },
    onError: () => {
      autoCreateRef.current = null;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (values: SendMessageValues) =>
      sendPrivateMessage(selectedConversationId as string, {
        content: values.content,
      }),
    onSuccess: async () => {
      messageForm.reset({
        content: "",
      });
      await queryClient.invalidateQueries({
        queryKey: ["messages", "conversation", selectedConversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: async (_, conversationId) => {
      await queryClient.invalidateQueries({
        queryKey: ["messages", "conversation", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    },
  });

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    if (!messagesViewportRef.current) {
      return;
    }

    messagesViewportRef.current.scrollTo({
      top: messagesViewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, selectedConversationId]);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      disconnectMessagesSocket();
      return;
    }

    const socket = getMessagesSocket(accessToken);
    socket.connect();

    const handleConversationUpserted = (event: { conversationId: string }) => {
      void queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });

      if (event.conversationId === selectedConversationIdRef.current) {
        void queryClient.invalidateQueries({
          queryKey: ["messages", "conversation", event.conversationId],
        });
      }
    };

    const handleMessageCreated = (event: {
      conversationId: string;
      message: ConversationDetails["messages"][number];
    }) => {
      if (event.conversationId === selectedConversationIdRef.current) {
        queryClient.setQueryData<ConversationDetails | undefined>(
          ["messages", "conversation", event.conversationId],
          (current) => {
            if (!current) {
              return current;
            }

            if (current.messages.some((message) => message.id === event.message.id)) {
              return current;
            }

            return {
              ...current,
              conversation: {
                ...current.conversation,
                lastMessage: event.message,
                lastMessageAt: event.message.createdAt,
                unreadCount:
                  event.message.senderId === currentUserIdRef.current
                    ? current.conversation.unreadCount
                    : current.conversation.unreadCount + 1,
              },
              messages: [...current.messages, event.message],
            };
          },
        );
      }

      void queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    };

    const handleConversationRead = (event: {
      conversationId: string;
      readByUserId: string;
    }) => {
      if (event.conversationId === selectedConversationIdRef.current) {
        queryClient.setQueryData<ConversationDetails | undefined>(
          ["messages", "conversation", event.conversationId],
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              conversation: {
                ...current.conversation,
                unreadCount:
                  event.readByUserId === currentUserIdRef.current
                    ? 0
                    : current.conversation.unreadCount,
              },
              messages: current.messages.map((message) =>
                message.senderId === currentUserIdRef.current && !message.readAt
                  ? {
                      ...message,
                      readAt: new Date().toISOString(),
                    }
                  : message,
              ),
            };
          },
        );
      }

      void queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    };

    socket.on("messages:conversation-upserted", handleConversationUpserted);
    socket.on("messages:message-created", handleMessageCreated);
    socket.on("messages:conversation-read", handleConversationRead);

    return () => {
      socket.off("messages:conversation-upserted", handleConversationUpserted);
      socket.off("messages:message-created", handleMessageCreated);
      socket.off("messages:conversation-read", handleConversationRead);
      socket.disconnect();
    };
  }, [accessToken, hydrated, queryClient]);

  useEffect(() => {
    if (currentUserQuery.data?.user) {
      setUser(currentUserQuery.data.user);
    }
  }, [currentUserQuery.data, setUser]);

  useEffect(() => {
    if (currentUserQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [clearSession, currentUserQuery.isError, router]);

  useEffect(() => {
    conversationForm.setValue("participantId", participantIdParam ?? "");
  }, [conversationForm, participantIdParam]);

  useEffect(() => {
    const participantId = participantIdParam?.trim();

    if (!participantId || createConversationMutation.isPending) {
      return;
    }

    const existingConversation = conversations.find(
      (conversation) => conversation.otherParticipant.id === participantId,
    );

    if (existingConversation) {
      if (conversationIdParam !== existingConversation.id) {
        router.replace(`/messages?conversationId=${existingConversation.id}`);
      }

      return;
    }

    if (autoCreateRef.current === participantId) {
      return;
    }

    autoCreateRef.current = participantId;
    createConversationMutation.mutate({
      participantId,
      content: "",
    });
  }, [
    conversationIdParam,
    conversations,
    createConversationMutation,
    participantIdParam,
    router,
  ]);

  useEffect(() => {
    autoReadRef.current = null;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!accessToken || !selectedConversationId) {
      return;
    }

    const socket = getMessagesSocket(accessToken);
    const joinConversation = () => {
      socket.emit("messages:join-conversation", {
        conversationId: selectedConversationId,
      });
    };

    joinConversation();
    socket.on("connect", joinConversation);

    return () => {
      socket.off("connect", joinConversation);
      socket.emit("messages:leave-conversation", {
        conversationId: selectedConversationId,
      });
    };
  }, [accessToken, selectedConversationId]);

  useEffect(() => {
    const conversation = messagesQuery.data?.conversation;

    if (!conversation || conversation.unreadCount === 0 || markAsReadMutation.isPending) {
      return;
    }

    if (autoReadRef.current === conversation.id) {
      return;
    }

    autoReadRef.current = conversation.id;
    markAsReadMutation.mutate(conversation.id, {
      onSettled: () => {
        autoReadRef.current = null;
      },
    });
  }, [markAsReadMutation, messagesQuery.data]);

  if (
    !hydrated ||
    (accessToken && (currentUserQuery.isLoading || conversationsQuery.isLoading))
  ) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[40px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_24px_90px_rgba(67,43,27,0.16)]">
          <div className="grid min-h-[78vh] lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="h-[78vh] bg-[color:var(--surface)]/55" />
            <div className="h-[78vh] bg-white/45" />
          </div>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[40px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_24px_90px_rgba(67,43,27,0.16)]">
          <div className="grid min-h-[78vh] lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,250,244,0.96),rgba(244,229,207,0.92))] lg:border-r lg:border-b-0">
              <div className="space-y-5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--foreground-subtle)]">
                      Wiadomosci
                    </p>
                    <h1 className="font-display text-3xl text-[color:var(--foreground)]">
                      Moje konwersacje
                    </h1>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </div>

                <div className="rounded-[28px] border border-[color:var(--border)] bg-white/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    Nowa rozmowa
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--foreground-muted)]">
                    Wyszukaj odbiorce po nazwie uzytkownika albo nazwie wyswietlanej.
                  </p>
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={conversationForm.handleSubmit((values) =>
                      createConversationMutation.mutate(values),
                    )}
                  >
                    <div className="space-y-3">
                      <Input
                        className="rounded-[18px] border-white/70 bg-white/75"
                        value={recipientSearch}
                        onChange={(event) => {
                          const value = event.target.value;
                          setRecipientSearch(value);
                          setSelectedRecipient(null);
                          conversationForm.setValue("participantId", "");
                        }}
                        placeholder="Wpisz nazwe odbiorcy"
                      />
                      {selectedRecipient ? (
                        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[color:var(--border)] bg-white/70 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                              {getParticipantLabel(selectedRecipient)}
                            </p>
                            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                              @{selectedRecipient.username}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setRecipientSearch("");
                              setSelectedRecipient(null);
                              conversationForm.setValue("participantId", "");
                            }}
                          >
                            Zmien
                          </Button>
                        </div>
                      ) : null}
                      {!selectedRecipient && recipientSearch.trim().length >= 2 ? (
                        <div className="overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-white/85 shadow-[0_12px_30px_rgba(83,55,33,0.08)]">
                          {recipientSearchQuery.isLoading ? (
                            <p className="px-4 py-3 text-sm text-[color:var(--foreground-muted)]">
                              Szukam graczy...
                            </p>
                          ) : null}
                          {recipientSearchQuery.isError ? (
                            <p className="px-4 py-3 text-sm text-[#9d3d2d]">
                              {getApiErrorMessage(recipientSearchQuery.error)}
                            </p>
                          ) : null}
                          {!recipientSearchQuery.isLoading &&
                          !recipientSearchQuery.isError &&
                          recipientOptions.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-[color:var(--foreground-muted)]">
                              Nie znaleziono pasujacego odbiorcy.
                            </p>
                          ) : null}
                          {!recipientSearchQuery.isLoading && !recipientSearchQuery.isError ? (
                            <div className="divide-y divide-[color:var(--border)]">
                              {recipientOptions.map((participant) => (
                                <button
                                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[color:var(--surface)]"
                                  key={participant.id}
                                  type="button"
                                  onClick={() => {
                                    setRecipientSearch(getParticipantLabel(participant));
                                    setSelectedRecipient(participant);
                                    conversationForm.setValue(
                                      "participantId",
                                      participant.id,
                                      { shouldValidate: true },
                                    );
                                  }}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                                      {getParticipantLabel(participant)}
                                    </p>
                                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                                      @{participant.username}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">
                                    {participant.role}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <p className="text-xs leading-5 text-[color:var(--foreground-subtle)]">
                        Wpisz przynajmniej 2 znaki, a potem wybierz odbiorce z listy.
                      </p>
                    </div>
                    <Textarea
                      className="min-h-24 rounded-[22px] border-white/70 bg-white/75"
                      {...conversationForm.register("content")}
                      placeholder="Pierwsza wiadomosc..."
                    />
                    <FormError
                      message={conversationForm.formState.errors.participantId?.message}
                    />
                    <FormError message={conversationForm.formState.errors.content?.message} />
                    <FormError
                      message={
                        createConversationMutation.isError
                          ? getApiErrorMessage(createConversationMutation.error)
                          : undefined
                      }
                    />
                    <Button
                      className="w-full"
                      size="lg"
                      type="submit"
                      disabled={createConversationMutation.isPending}
                    >
                      {createConversationMutation.isPending
                        ? "Tworzenie..."
                        : "Rozpocznij rozmowe"}
                    </Button>
                  </form>
                </div>

                <div className="space-y-3">
                  {conversationsQuery.isError ? (
                    <div className="rounded-[22px] border border-[#e3b0a7] bg-[#fff2ef] px-4 py-3 text-sm text-[#9d3d2d]">
                      {getApiErrorMessage(conversationsQuery.error)}
                    </div>
                  ) : null}

                  {conversations.length ? (
                    conversations.map((conversation) => {
                      const isActive = selectedConversationId === conversation.id;
                      const participantLabel = getParticipantLabel(
                        conversation.otherParticipant,
                      );

                      return (
                        <button
                          className={`group w-full rounded-[28px] border px-4 py-4 text-left transition ${
                            isActive
                              ? "border-[color:var(--accent)] bg-[linear-gradient(135deg,rgba(184,95,47,0.14),rgba(255,255,255,0.9))] shadow-[0_16px_40px_rgba(96,58,32,0.14)]"
                              : "border-[color:var(--border)] bg-white/62 hover:bg-white/82"
                          }`}
                          key={conversation.id}
                          type="button"
                          onClick={() =>
                            router.replace(`/messages?conversationId=${conversation.id}`)
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#bc6f3c,#8f4520)] text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(96,58,32,0.24)]">
                              {getParticipantInitials(participantLabel)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-base font-semibold text-[color:var(--foreground)]">
                                  {participantLabel}
                                </p>
                                <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                                  {formatShortTime(conversation.lastMessageAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-[color:var(--foreground-muted)]">
                                {conversation.lastMessage
                                  ? conversation.lastMessage.content
                                  : "Rozmowa jest gotowa, ale nie ma jeszcze zadnej wiadomosci."}
                              </p>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--foreground-subtle)]">
                                  {conversation.unreadCount ? "Nowe wiadomosci" : "Brak nowych"}
                                </span>
                                {conversation.unreadCount ? (
                                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[color:var(--accent)] px-2 text-xs font-semibold text-white">
                                    {conversation.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/45 px-4 py-5 text-sm leading-7 text-[color:var(--foreground-muted)]">
                      Nie masz jeszcze rozmow. Zacznij od formularza powyzej albo z profilu gracza.
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <section className="flex min-h-[78vh] flex-col bg-[linear-gradient(180deg,rgba(255,252,248,0.96),rgba(244,230,211,0.7))]">
              <div className="border-b border-[color:var(--border)] px-6 py-5">
                {selectedConversation ? (
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#bc6f3c,#8f4520)] text-base font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(96,58,32,0.24)]">
                      {getParticipantInitials(
                        getParticipantLabel(selectedConversation.otherParticipant),
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-3xl text-[color:var(--foreground)]">
                        {getParticipantLabel(selectedConversation.otherParticipant)}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--foreground-muted)]">
                        Ostatnia aktywnosc: {formatMessageDate(selectedConversation.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--foreground-subtle)]">
                      Czat
                    </p>
                    <h2 className="font-display text-3xl text-[color:var(--foreground)]">
                      Wybierz rozmowe
                    </h2>
                  </div>
                )}
              </div>

              <div
                className="flex-1 overflow-y-auto px-5 py-6 lg:px-8"
                ref={messagesViewportRef}
              >
                {messagesQuery.isLoading && selectedConversationId ? (
                  <div className="space-y-4">
                    <div className="h-24 w-3/5 rounded-[28px] bg-[color:var(--surface-strong)]" />
                    <div className="ml-auto h-24 w-2/5 rounded-[28px] bg-[color:var(--surface-strong)]" />
                    <div className="h-24 w-1/2 rounded-[28px] bg-[color:var(--surface-strong)]" />
                  </div>
                ) : null}

                {messagesQuery.isError ? (
                  <div className="rounded-[22px] border border-[#e3b0a7] bg-[#fff2ef] px-4 py-3 text-sm text-[#9d3d2d]">
                    {getApiErrorMessage(messagesQuery.error)}
                  </div>
                ) : null}

                {selectedConversationId && messages.length ? (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === currentUser?.id;

                      return (
                        <div
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          key={message.id}
                        >
                          <div
                            className={`flex max-w-[84%] flex-col ${
                              isOwnMessage ? "items-end" : "items-start"
                            }`}
                          >
                            <span className="mb-1 px-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                              {getParticipantLabel(message.sender)}
                            </span>
                            <div
                              className={`relative rounded-[28px] px-5 py-4 shadow-[0_14px_40px_rgba(83,55,33,0.12)] ${
                                isOwnMessage
                                  ? "rounded-br-[10px] bg-[linear-gradient(135deg,#bc6f3c,#8f4520)] text-white"
                                  : "rounded-bl-[10px] border border-[color:var(--border)] bg-white/88 text-[color:var(--foreground)]"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-[15px] leading-7">
                                {message.content}
                              </p>
                            </div>
                            <span className="mt-2 px-2 text-[11px] tracking-[0.12em] text-[color:var(--foreground-subtle)]">
                              {formatMessageDate(message.createdAt)}
                              {isOwnMessage && message.readAt ? " - przeczytano" : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : selectedConversationId ? (
                  <div className="flex h-full min-h-[280px] items-center justify-center">
                    <div className="max-w-md rounded-[28px] border border-dashed border-[color:var(--border)] bg-white/55 px-6 py-8 text-center">
                      <p className="font-display text-3xl text-[color:var(--foreground)]">
                        Rozmowa czeka na start
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-muted)]">
                        Wyslij pierwsza wiadomosc ponizej, a druga osoba zobaczy ja od razu.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center">
                    <div className="max-w-md rounded-[28px] border border-dashed border-[color:var(--border)] bg-white/55 px-6 py-8 text-center">
                      <p className="font-display text-3xl text-[color:var(--foreground)]">
                        Otworz czat
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-muted)]">
                        Wybierz jedna z konwersacji po lewej stronie albo rozpocznij nowa.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[color:var(--border)] bg-white/45 px-5 py-5 lg:px-8">
                {selectedConversationId ? (
                  <form
                    className="space-y-4"
                    onSubmit={messageForm.handleSubmit((values) =>
                      sendMessageMutation.mutate(values),
                    )}
                  >
                    <div className="rounded-[30px] border border-[color:var(--border)] bg-white/80 p-3 shadow-[0_16px_40px_rgba(83,55,33,0.1)]">
                      <Textarea
                        className="min-h-28 border-0 bg-transparent shadow-none focus-visible:ring-0"
                        {...messageForm.register("content")}
                        placeholder="Napisz wiadomosc do drugiego gracza..."
                      />
                      <div className="mt-3 flex items-center justify-between gap-3 px-2 pb-1">
                        <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                          Realtime wlaczony
                        </div>
                        <Button
                          size="lg"
                          type="submit"
                          disabled={sendMessageMutation.isPending}
                        >
                          {sendMessageMutation.isPending ? "Wysylanie..." : "Wyslij"}
                        </Button>
                      </div>
                    </div>
                    <FormError message={messageForm.formState.errors.content?.message} />
                    <FormError
                      message={
                        sendMessageMutation.isError
                          ? getApiErrorMessage(sendMessageMutation.error)
                          : undefined
                      }
                    />
                  </form>
                ) : (
                  <div className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                    Po wybraniu rozmowy tutaj pojawi sie pole wpisywania wiadomosci.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function getParticipantLabel(participant: MessageParticipant) {
  return participant.displayName || participant.username;
}

function getParticipantInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMessageDate(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatShortTime(value: string) {
  return new Date(value).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#9d3d2d]">{message}</p>;
}
