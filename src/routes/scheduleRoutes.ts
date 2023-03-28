import express from 'express';
import controller from '../controllers/scheduleController';

const router = express.Router();

router.get('/schedule', controller.getSchedule);

export = router;
