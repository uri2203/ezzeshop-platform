import { Router } from 'express';
import { streamingController } from '../controllers/streaming.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Públicas
router.get('/', streamingController.listContent);
router.get('/:id', streamingController.getContent);
router.post('/:id/view', streamingController.startViewingSession);
router.patch('/sessions', streamingController.updateViewingSession);

// Protegidas
router.post('/', authenticate, streamingController.createContent);
router.get('/me/content', authenticate, streamingController.myContent);

export default router;
