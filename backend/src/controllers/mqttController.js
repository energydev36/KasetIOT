const { publishMessage } = require('../services/mqttService');
const Device = require('../models/Device');
const SensorReading = require('../models/SensorReading');

const DeviceTemplate = require('../models/DeviceTemplate');

exports.controlDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { zone, action } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Fetch template name
    let templateName = 'default';
    try {
      const tpl = await DeviceTemplate.findById(device.templateId);
      if (tpl && tpl.name) templateName = tpl.name;
    } catch (e) {
      console.error('[MQTT] Error fetching device template name:', e);
    }


    // Publish MQTT message to new topic structure: kaset/{template}/{serial}/{zone}/set
    const topic = `kaset/${templateName}/${device.serialNumber}/${zone}/set`;
    // Publish plain 'on'/'off' strings for set commands
    const payload = (typeof action === 'string') ? action : String(action);

    publishMessage(topic, payload);

    // Don't persist /set commands to SensorReading - only actual device responses from /state should be saved
    // This prevents the UI from seeing our own command as if the device had confirmed it
    console.log(`[MQTT] Sent command to ${topic}: ${payload} (not persisting to avoid false confirmation)`);

    res.status(200).json({
      message: 'Command sent',
      topic,
      payload,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSensorData = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Return latest reading per topic for this device
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

    // Build a sensorReadings map keyed by normalized topic (remove '-state' suffix)
    const sensorReadings = {};
    latest.forEach((item) => {
      const rawKey = item.topic;
      const key = rawKey && typeof rawKey === 'string' ? rawKey.replace(/-state$/, '') : rawKey;
      // prefer common payload shapes: { value }, { state }, { action } else raw payload
      let val;
      if (item.payload && typeof item.payload === 'object') {
        if (typeof item.payload.value !== 'undefined') val = item.payload.value;
        else if (typeof item.payload.state !== 'undefined') val = item.payload.state;
        else if (typeof item.payload.action !== 'undefined') val = item.payload.action;
        else val = item.payload;
      } else {
        val = item.payload;
      }
      // normalize common string values
      if (typeof val === 'string') val = val.toLowerCase();
      sensorReadings[key] = val;
    });

    res.status(200).json({
      device: device._id,
      serialNumber: device.serialNumber,
      latest,
      sensorReadings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
