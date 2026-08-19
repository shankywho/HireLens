import { Router } from 'express';
import { getCollectors, approveHeal, healCollector, triggerCollector, simulateBreak } from '../controllers/collectorController';

const router = Router();

router.get('/', getCollectors);
router.get('/health', getCollectors);
router.post('/approve-patch', approveHeal);
router.post('/:id/approve-heal', approveHeal);
router.post('/approve-heal', approveHeal);
router.post('/:id/approve', approveHeal);
router.post('/approve', approveHeal);
router.post('/:id/heal', healCollector);
router.post('/heal-collector', healCollector);
router.post('/trigger', triggerCollector);
router.post('/simulate-break', simulateBreak);
router.post('/simulate-drift', simulateBreak);
router.post('/break', simulateBreak);

export default router;
