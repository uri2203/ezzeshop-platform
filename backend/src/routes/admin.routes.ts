import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getApiKeys, upsertApiKeys } from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/config/api-keys', getApiKeys);
router.put('/config/api-keys', upsertApiKeys);

export default router;
