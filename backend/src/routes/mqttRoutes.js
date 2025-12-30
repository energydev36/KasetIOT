const express = require('express');
const { controlDevice, getSensorData } = require('../controllers/mqttController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/:deviceId/control', authMiddleware, controlDevice);
router.get('/:deviceId/sensors', authMiddleware, getSensorData);

module.exports = router;
