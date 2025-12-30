const express = require('express');
const {
  getUserDevices,
  addDevice,
  getDeviceDetail,
  updateDeviceName,
  updateDeviceSettings,
  deleteDevice,
  hideDeviceForUser,
  getHiddenDevices,
  unhideDevice,
  getDeviceSettingsAndState,
} = require('../controllers/deviceController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, getUserDevices);
router.get('/hidden', authMiddleware, getHiddenDevices);
router.post('/', authMiddleware, addDevice);
router.get('/:id', authMiddleware, getDeviceDetail);
router.get('/:id/settings-state', authMiddleware, getDeviceSettingsAndState);
router.put('/:id/name', authMiddleware, updateDeviceName);
router.put('/:id/settings', authMiddleware, updateDeviceSettings);
router.delete('/:id', authMiddleware, deleteDevice);
router.post('/:id/hide', authMiddleware, hideDeviceForUser);
router.post('/:id/unhide', authMiddleware, unhideDevice);

module.exports = router;
