const User = require('../models/User');
const Device = require('../models/Device');

// Admin only
exports.getAllUsers = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this' });
    }

    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this' });
    }

    const devices = await Device.find().populate('templateId').populate('ownerId');
    res.status(200).json({ devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this' });
    }

    const targetUser = await User.findByIdAndUpdate(
      req.params.id,
      { suspended: true },
      { new: true }
    );

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User suspended', user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this' });
    }

    const targetUser = await User.findByIdAndUpdate(
      req.params.id,
      { suspended: false },
      { new: true }
    );

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User unsuspended', user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this' });
    }

    // Delete user and their devices
    await Device.deleteMany({ ownerId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'User and devices deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
