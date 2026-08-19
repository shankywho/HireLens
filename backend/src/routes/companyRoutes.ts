import { Router } from 'express';
import { getCompanies, getCompanyById } from '../controllers/companyController';

const router = Router();

router.get('/', getCompanies);
router.get('/:id', getCompanyById);

export default router;
