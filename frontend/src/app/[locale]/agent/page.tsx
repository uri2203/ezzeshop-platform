'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Send, Plus, Bot, User, Zap, Building2, Video, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAgentStore } from '@/store/agent.store';
import { cn } from '@/lib/utils';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
        isUser ? 'gradient-brand' : 'bg-muted',
      )}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-foreground" />}
      </div>
      <div className={cn(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'gradient-brand text-white rounded-tr-sm'
          : 'bg-muted text-foreground rounded-tl-sm',
      )}>
        {content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  );
}

export default function AgentPage() {
  const t = useTranslations('agent');
  const locale = useLocale();
  const { activeConversation, isStreaming, streamingText, startConversation, sendMessageStream } = useAgentStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingText]);

  async function handleSend() {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setInput('');
    await sendMessageStream(msg, locale);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const quickActions = [
    { label: t('onboarding_client'), type: 'onboarding_client', icon: Building2 },
    { label: t('onboarding_creator'), type: 'onboarding_creator', icon: Video },
    { label: t('create_campaign'), type: 'campaign_wizard', icon: Wand2 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-e border-border bg-card/50 p-4 md:flex md:flex-col">
          <Button
            variant="gradient"
            size="sm"
            className="mb-4 w-full gap-2"
            onClick={() => void startConversation('general')}
          >
            <Plus className="h-4 w-4" /> {t('new_chat')}
          </Button>

          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Inicio rápido
          </p>
          <div className="space-y-1">
            {quickActions.map(({ label, type, icon: Icon }) => (
              <button
                key={type}
                onClick={() => void startConversation(type)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="line-clamp-1">{label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {!activeConversation ? (
            /* Welcome screen */
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-brand">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
              <p className="mb-8 max-w-md text-muted-foreground">{t('subtitle')}</p>

              <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
                {quickActions.map(({ label, type, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => void startConversation(type)}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center text-sm hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className="rounded-xl bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <>
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="mx-auto max-w-3xl space-y-4">
                  {activeConversation.messages.map((msg, i) => (
                    <MessageBubble key={i} role={msg.role} content={msg.content} />
                  ))}
                  {isStreaming && streamingText && (
                    <MessageBubble role="assistant" content={streamingText} />
                  )}
                  {isStreaming && !streamingText && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-border bg-background/80 p-4 backdrop-blur-sm">
                <div className="mx-auto flex max-w-3xl items-end gap-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('placeholder')}
                    rows={1}
                    disabled={isStreaming}
                    className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
                    style={{ maxHeight: '120px' }}
                  />
                  <Button
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isStreaming}
                    size="icon"
                    variant="gradient"
                    className="h-11 w-11 flex-shrink-0 rounded-2xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  EzzeShop AI · Powered by Claude
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
