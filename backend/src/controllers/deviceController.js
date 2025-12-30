const Device = require('../models/Device');
const DeviceTemplate = require('../models/DeviceTemplate');
const SensorReading = require('../models/SensorReading');

exports.getUserDevices = async (req, res) => {
  try {
    // Exclude devices that the current user has hidden
    const devices = await Device.find({
      ownerId: req.userId,
      hiddenFor: { $nin: [req.userId] },
    }).populate('templateId');
    res.status(200).json({ devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addDevice = async (req, res) => {
  try {
    const { serialNumber, templateId } = req.body;

    // Check if device already exists
    const existingDevice = await Device.findOne({ serialNumber });
    
    if (existingDevice) {
      // If device exists and belongs to the current user (might be hidden)
      if (existingDevice.ownerId.toString() === req.userId) {
        // Unhide the device if it was hidden
        if (existingDevice.hiddenFor && existingDevice.hiddenFor.includes(req.userId)) {
          await Device.findByIdAndUpdate(existingDevice._id, {
            $pull: { hiddenFor: req.userId },
          });
          
          const updatedDevice = await Device.findById(existingDevice._id).populate('templateId');
          return res.status(200).json({
            message: 'Device restored successfully',
            device: updatedDevice,
          });
        }
        
        // Device already visible for this user
        return res.status(400).json({ error: 'Device already exists in your list' });
      }
      
      // Device belongs to another user
      return res.status(400).json({ error: 'ไม่สามารถเพิ่มอุปกรณ์นี้ได้ โปรดติดต่อผู้ดูแล' });
    }

    // Check if template exists
    const template = await DeviceTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create new device
    const device = new Device({
      serialNumber: serialNumber.toUpperCase(),
      templateId,
      ownerId: req.userId,
      name: template.name,
    });

    await device.save();

    res.status(201).json({
      message: 'Device added successfully',
      device: await device.populate('templateId'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeviceDetail = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('templateId');

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json({ device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDeviceName = async (req, res) => {
  try {
    const { name } = req.body;
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    device.name = name;
    await device.save();

    res.status(200).json({ message: 'Device updated', device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDeviceSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    device.settings = { ...device.settings, ...settings };
    await device.save();

    res.status(200).json({ message: 'Settings updated', device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Device.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Device deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft-hide device for current user (still visible to admin)
exports.hideDeviceForUser = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Device.findByIdAndUpdate(req.params.id, {
      $addToSet: { hiddenFor: req.userId },
    });

    res.status(200).json({ message: 'Device hidden for user' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHiddenDevices = async (req, res) => {
  try {
    // Get devices that the current user has hidden
    const devices = await Device.find({
      ownerId: req.userId,
      hiddenFor: { $in: [req.userId] },
    }).populate('templateId');
    res.status(200).json({ devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unhideDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Device.findByIdAndUpdate(req.params.id, {
      $pull: { hiddenFor: req.userId },
    });

    res.status(200).json({ message: 'Device restored successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeviceSettingsAndState = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('templateId');

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const template = device.templateId;

    const mergeWithOverrides = (base = [], overrides = []) => {
      const overrideMap = new Map();
      overrides.forEach((item) => {
        if (item && item.id) {
          overrideMap.set(item.id, item);
        }
      });

      return base.map((item) => {
        const plain = item && typeof item.toObject === 'function' ? item.toObject() : item;
        const override = overrideMap.get(plain.id) || {};
        return { ...plain, ...override };
      });
    };

    const outputs = mergeWithOverrides(template?.outputs || [], device.settings?.outputs || []);
    const digitalSensors = mergeWithOverrides(
      template?.digitalSensors || [],
      device.settings?.digitalSensors || []
    );
    const analogSensors = mergeWithOverrides(
      template?.analogSensors || [],
      device.settings?.analogSensors || []
    );
    const rs485Sensors = mergeWithOverrides(
      template?.rs485Sensors || [],
      device.settings?.rs485Sensors || []
    );

    const latest = await SensorReading.aggregate([
      { $match: { deviceId: device._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$topic',
          topic: { $first: '$topic' },
          payload: { $first: '$payload' },
          source: { $first: '$source' },
          userId: { $first: '$userId' },
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { topic: 1 } },
    ]);

    const sensorReadings = {};
    latest.forEach((item) => {
      const rawKey = item.topic;
      const key = rawKey && typeof rawKey === 'string' ? rawKey.replace(/-state$/, '') : rawKey;
      let val;
      if (item.payload && typeof item.payload === 'object') {
        if (typeof item.payload.value !== 'undefined') val = item.payload.value;
        else if (typeof item.payload.state !== 'undefined') val = item.payload.state;
        else if (typeof item.payload.action !== 'undefined') val = item.payload.action;
        else val = item.payload;
      } else {
        val = item.payload;
      }
      if (typeof val === 'string') val = val.toLowerCase();
      sensorReadings[key] = val;
    });

    res.status(200).json({
      device: {
        id: device._id,
        serialNumber: device.serialNumber,
        name: device.name,
        template: template
          ? { id: template._id, name: template.name, topics: template.topics || {} }
          : null,
      },
      settings: {
        zones: device.settings?.zones || [],
        outputs,
        digitalSensors,
        analogSensors,
        rs485Sensors,
      },
      sensorReadings,
      latestReadings: latest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
