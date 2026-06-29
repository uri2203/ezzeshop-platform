import { Router } from 'express';
import { campaignsController } from '../controllers/campaigns.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('client', 'admin'), campaignsController.create);
router.get('/', authorize('client', 'admin'), campaignsController.list);
router.get('/:id', campaignsController.get);
router.post('/:id/matches/find', authorize('client', 'admin'), campaignsController.findMatches);
router.get('/:id/matches', campaignsController.getMatches);

export default router;
