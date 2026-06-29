import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { agentService } from '../services/ai/agent.service';

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  type: z.enum(['onboarding_client', 'onboarding_creator', 'campaign_wizard', 'general']).default('general'),
  locale: z.string().default('es'),
});

export const agentController = {
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId, type, locale } = chatSchema.parse(req.body);
      const userId = req.user!.sub;

      let convId = conversationId;
      if (!convId) {
        const conv = await agentService.getOrCreateConversation(userId, type);
        convId = conv.id;
      }

      const { reply, conversationId: finalId } = await agentService.chat(userId, convId, message, locale);
      res.json({ success: true, data: { reply, conversationId: finalId } });
    } catch (err) {
      next(err);
    }
  },

  async streamChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId, type, locale } = chatSchema.parse(req.body);
      const userId = req.user!.sub;

      let convId = conversationId;
      if (!convId) {
        const conv = await agentService.getOrCreateConversation(userId, type);
        convId = conv.id;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ conversationId: convId })}\n\n`);

      await agentService.streamChat(userId, convId, message, locale, (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      next(err);
    }
  },

  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await agentService.getConversations(req.user!.sub);
      res.json({ success: true, data: conversations });
    } catch (err) {
      next(err);
    }
  },

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await agentService.getConversation(req.user!.sub, req.params['id'] ?? '');
      res.json({ success: true, data: conv });
    } catch (err) {
      next(err);
    }
  },
};
