import { Router } from 'express';
import { getListings, getListingById } from '../controllers/listingController';

const router = Router();

router.get('/', getListings);
router.get('/:normalizedJobId', getListingById);

export default router;
