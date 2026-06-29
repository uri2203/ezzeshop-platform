import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/chat', agentController.chat);
router.post('/chat/stream', agentController.streamChat);
router.get('/conversations', agentController.getConversations);
router.get('/conversations/:id', agentController.getConversation);

export default router;
