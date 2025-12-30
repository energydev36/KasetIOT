const DeviceTemplate = require('../models/DeviceTemplate');
const User = require('../models/User');

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await DeviceTemplate.find();
    res.status(200).json({ templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTemplateDetail = async (req, res) => {
  try {
    const template = await DeviceTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json({ template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create templates' });
    }

    const { name, description, enabledSensors, outputs, digitalSensors, analogSensors, rs485Sensors, topics } =
      req.body;

    const template = new DeviceTemplate({
      name,
      description,
      enabledSensors: enabledSensors || { outputs: true, digitalSensors: true, analogSensors: true, rs485Sensors: true },
      outputs: outputs || [],
      digitalSensors: digitalSensors || [],
      analogSensors: analogSensors || [],
      rs485Sensors: rs485Sensors || [],
      topics: topics || {},
    });

    await template.save();

    res.status(201).json({
      message: 'Template created successfully',
      template,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update templates' });
    }

    const { name, description, enabledSensors, outputs, digitalSensors, analogSensors, rs485Sensors, topics } =
      req.body;

    const template = await DeviceTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        enabledSensors,
        outputs,
        digitalSensors,
        analogSensors,
        rs485Sensors,
        topics,
      },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json({ message: 'Template updated', template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete templates' });
    }

    const template = await DeviceTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
