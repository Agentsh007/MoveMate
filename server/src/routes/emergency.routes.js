// Emergency Routes — ALL PUBLIC (no login required)
import { Router } from 'express';
import { getEmergencyContacts, getEmergencyCategories, reportContact } from '../controllers/emergency.controller.js';

const router = Router();

router.get('/', getEmergencyContacts);
router.get('/categories', getEmergencyCategories);
router.post('/report', reportContact);

export default router;
