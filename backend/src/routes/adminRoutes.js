const express = require('express');
const {
  getAllUsers,
  getAllDevices,
  suspendUser,
  unsuspendUser,
  deleteUser,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/users', authMiddleware, getAllUsers);
router.get('/devices', authMiddleware, getAllDevices);
router.put('/users/:id/suspend', authMiddleware, suspendUser);
router.put('/users/:id/unsuspend', authMiddleware, unsuspendUser);
router.delete('/users/:id', authMiddleware, deleteUser);

module.exports = router;
