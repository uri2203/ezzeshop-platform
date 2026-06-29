import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import type { AgentConversation, AgentMessage, User } from '../../types';

const client = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });

const SYSTEM_PROMPTS: Record<string, string> = {
  onboarding_client: `Eres el agente IA de EzzeShop, una plataforma de publicidad digital.
Tu rol es ayudar a empresas y marcas a entender cómo pueden hacer crecer su negocio mediante campañas con creadores de contenido en EzzeTV.

Sigue este flujo de onboarding:
1. Saluda calurosamente y pregunta el nombre de la empresa
2. Pregunta a qué industria pertenecen y qué productos/servicios ofrecen
3. Pregunta cuál es su audiencia objetivo (edad, género, países)
4. Pregunta su presupuesto mensual aproximado para publicidad
5. Explica cómo EzzeShop conecta su marca con creadores de contenido perfectos
6. Propón los próximos pasos: crear una campaña

Sé conversacional, empático y profesional. Responde SIEMPRE en el mismo idioma que el usuario.
Extrae y guarda mentalmente: empresa, industria, audiencia, presupuesto, países objetivo.`,

  onboarding_creator: `Eres el agente IA de EzzeShop, una plataforma de monetización para creadores de contenido.
Tu rol es ayudar a creadores a entender cómo pueden monetizar su audiencia con publicidad premium en EzzeTV.

Sigue este flujo:
1. Saluda y pregunta el nombre del creador y su canal/marca personal
2. Pregunta sobre qué nichos crea contenido (gaming, lifestyle, tech, etc.)
3. Pregunta su audiencia aproximada (suscriptores, viewers promedio)
4. Pregunta los países principales de su audiencia
5. Explica cómo las marcas pagan para aparecer en su contenido via EzzeTV
6. Menciona que pueden ganar desde $X CPM según su nicho y audiencia
7. Propón completar su perfil para comenzar a recibir ofertas

Sé entusiasta y motivador. Responde SIEMPRE en el mismo idioma que el usuario.`,

  campaign_wizard: `Eres el agente IA de EzzeShop especializado en crear campañas publicitarias efectivas.
Tu rol es guiar al cliente paso a paso para crear una campaña perfecta.

Recopila esta información conversacionalmente:
1. Objetivo de la campaña (awareness, tráfico, conversiones, instalaciones)
2. Presupuesto total y duración
3. Nicho o tipo de creadores preferidos
4. Países o regiones objetivo
5. Formato del anuncio (pre-roll, contenido patrocinado, etc.)
6. URL de destino y call to action
7. Creatividad del anuncio (lo tienen o necesitan ayuda)

Al final, resume todo y pregunta si desean proceder.
Responde SIEMPRE en el mismo idioma que el usuario.`,

  general: `Eres el agente IA de EzzeShop, una plataforma de publicidad digital que conecta marcas con creadores de contenido en EzzeTV.
Ayuda a los usuarios con cualquier pregunta sobre la plataforma, campañas, monetización o funcionamiento.
Sé útil, claro y conciso. Responde SIEMPRE en el mismo idioma que el usuario.`,
};

export const agentService = {
  async getOrCreateConversation(
    userId: string,
    type: string,
  ): Promise<AgentConversation> {
    const existing = await queryOne<AgentConversation>(
      `SELECT * FROM agent_conversations
       WHERE user_id = $1 AND type = $2 AND is_active = true
       ORDER BY updated_at DESC LIMIT 1`,
      [userId, type],
    );
    if (existing) return existing;

    const [conv] = await query<AgentConversation>(
      `INSERT INTO agent_conversations (user_id, type, messages, language)
       VALUES ($1, $2, '[]'::jsonb, 'es')
       RETURNING *`,
      [userId, type],
    );
    if (!conv) throw new Error('Error creando conversación');
    return conv;
  },

  async chat(
    userId: string,
    conversationId: string,
    userMessage: string,
    userLocale: string,
  ): Promise<{ reply: string; conversationId: string }> {
    const conv = await queryOne<AgentConversation>(
      'SELECT * FROM agent_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId],
    );
    if (!conv) throw new NotFoundError('Conversación');

    const user = await queryOne<Pick<User, 'first_name' | 'last_name' | 'locale'>>(
      'SELECT first_name, last_name, locale FROM users WHERE id = $1',
      [userId],
    );

    const systemPrompt = SYSTEM_PROMPTS[conv.type] ?? SYSTEM_PROMPTS['general'] ?? '';
    const userContext = user
      ? `\n\nContexto del usuario: ${user.first_name} ${user.last_name}, idioma preferido: ${userLocale || user.locale}`
      : '';

    const messages = conv.messages as AgentMessage[];
    messages.push({ role: 'user', content: userMessage, timestamp: new Date().toISOString() });

    const anthropicMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt + userContext,
      messages: anthropicMessages,
    });

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : '';
    messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });

    const tokensUsed = (conv.tokens_used ?? 0) + (response.usage.input_tokens + response.usage.output_tokens);

    await query(
      `UPDATE agent_conversations
       SET messages = $1::jsonb, language = $2, tokens_used = $3, updated_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(messages), userLocale, tokensUsed, conv.id],
    );

    return { reply, conversationId: conv.id };
  },

  async streamChat(
    userId: string,
    conversationId: string,
    userMessage: string,
    userLocale: string,
    onChunk: (text: string) => void,
  ): Promise<void> {
    const conv = await queryOne<AgentConversation>(
      'SELECT * FROM agent_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId],
    );
    if (!conv) throw new NotFoundError('Conversación');

    const systemPrompt = SYSTEM_PROMPTS[conv.type] ?? SYSTEM_PROMPTS['general'] ?? '';
    const messages = conv.messages as AgentMessage[];
    messages.push({ role: 'user', content: userMessage, timestamp: new Date().toISOString() });

    const anthropicMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let fullReply = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullReply += chunk.delta.text;
        onChunk(chunk.delta.text);
      }
      if (chunk.type === 'message_start') {
        inputTokens = chunk.message.usage.input_tokens;
      }
      if (chunk.type === 'message_delta') {
        outputTokens = chunk.usage.output_tokens;
      }
    }

    messages.push({ role: 'assistant', content: fullReply, timestamp: new Date().toISOString() });
    const tokensUsed = (conv.tokens_used ?? 0) + inputTokens + outputTokens;

    await query(
      `UPDATE agent_conversations
       SET messages = $1::jsonb, language = $2, tokens_used = $3, updated_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(messages), userLocale, tokensUsed, conv.id],
    );
  },

  async getConversations(userId: string): Promise<AgentConversation[]> {
    return query<AgentConversation>(
      `SELECT id, user_id, type, title, language, is_active, tokens_used, created_at, updated_at,
              (messages->-1) as last_message
       FROM agent_conversations WHERE user_id = $1
       ORDER BY updated_at DESC LIMIT 20`,
      [userId],
    );
  },

  async getConversation(userId: string, conversationId: string): Promise<AgentConversation> {
    const conv = await queryOne<AgentConversation>(
      'SELECT * FROM agent_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId],
    );
    if (!conv) throw new NotFoundError('Conversación');
    return conv;
  },
};
