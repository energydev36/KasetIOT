const express = require('express');
const {
  getDeviceSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Log all requests to this route
router.use((req, res, next) => {
  console.log(`[ScheduleRoute] ${req.method} ${req.originalUrl}`);
  console.log(`[ScheduleRoute] params:`, req.params);
  next();
});

router.get('/', authMiddleware, getDeviceSchedules);
router.post('/', authMiddleware, addSchedule);
router.put('/:id', authMiddleware, (req, res, next) => {
  console.log('[ScheduleRoute] PUT /:id matched - calling updateSchedule');
  updateSchedule(req, res, next);
});
router.delete('/:id', authMiddleware, deleteSchedule);

module.exports = router;
