import { Router } from 'express';
import { creatorsController } from '../controllers/creators.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.get('/', creatorsController.listPublic);
router.get('/:id', creatorsController.getPublic);

// Rutas protegidas
router.get('/me/profile', authenticate, authorize('creator'), creatorsController.getProfile);
router.put('/me/profile', authenticate, authorize('creator'), creatorsController.updateProfile);
router.get('/me/matches', authenticate, authorize('creator'), creatorsController.getMyMatches);
router.post('/me/matches/:matchId/respond', authenticate, authorize('creator'), creatorsController.respondToMatch);

export default router;
