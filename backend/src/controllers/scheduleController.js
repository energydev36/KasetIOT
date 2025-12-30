const Schedule = require('../models/Schedule');
const Device = require('../models/Device');

exports.getDeviceSchedules = async (req, res) => {
  try {
    const device = await Device.findById(req.params.deviceId);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const schedules = await Schedule.find({ deviceId: req.params.deviceId });
    res.status(200).json({ schedules });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addSchedule = async (req, res) => {
  try {
    const { zone, round, startTime, duration, days } = req.body;

    const device = await Device.findById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // If a schedule for the same zone/round already exists, update it instead of creating a duplicate
    const existing = await Schedule.findOne({
      deviceId: req.params.deviceId,
      zone,
      round,
    });

    let schedule;

    if (existing) {
      existing.startTime = startTime;
      existing.duration = duration;
      existing.days = days;
      schedule = await existing.save();
      return res.status(200).json({
        message: 'Schedule updated successfully',
        schedule,
      });
    }

    schedule = new Schedule({
      deviceId: req.params.deviceId,
      zone,
      round,
      startTime,
      duration,
      days,
    });

    await schedule.save();

    res.status(201).json({
      message: 'Schedule added successfully',
      schedule,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  console.log('\n========== [Schedule] updateSchedule START ==========');
  console.log('[Schedule] params:', JSON.stringify(req.params, null, 2));
  console.log('[Schedule] body:', JSON.stringify(req.body, null, 2));
  console.log('[Schedule] userId:', req.userId);
  
  try {
    const { startTime, duration, days, enabled } = req.body;
    console.log('[Schedule] destructured values:', { startTime, duration, days, enabled });
    
    const scheduleId = req.params.id;
    const deviceId = req.params.deviceId;
    
    console.log('[Schedule] Finding schedule:', scheduleId);
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      console.log('[Schedule] Schedule not found!');
      return res.status(404).json({ message: 'Schedule not found' });
    }

    console.log('[Schedule] Found schedule:', JSON.stringify(schedule, null, 2));

    const device = await Device.findById(schedule.deviceId);
    console.log('[Schedule] device.ownerId:', device.ownerId);
    console.log('[Schedule] req.userId:', req.userId);
    console.log('[Schedule] Match:', device.ownerId.toString() === req.userId);
    
    if (device.ownerId.toString() !== req.userId) {
      console.log('[Schedule] Unauthorized - owner mismatch');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (schedule.deviceId.toString() !== deviceId) {
      console.log('[Schedule] Device ID mismatch');
      return res.status(404).json({ message: 'Schedule not found for this device' });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (startTime !== undefined) updateData.startTime = startTime;
    if (duration !== undefined) updateData.duration = duration;
    if (days !== undefined) updateData.days = days;
    if (enabled !== undefined) updateData.enabled = enabled;

    console.log('[Schedule] Update data to apply:', JSON.stringify(updateData, null, 2));

    // Use findByIdAndUpdate for atomic update
    console.log('[Schedule] Calling findByIdAndUpdate...');
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log('[Schedule] Schedule updated successfully:', JSON.stringify(updatedSchedule, null, 2));
    console.log('========== [Schedule] updateSchedule END ==========\n');
    
    res.status(200).json({ message: 'Schedule updated', schedule: updatedSchedule });
  } catch (error) {
    console.error('[Schedule] Error in updateSchedule:', error);
    console.log('========== [Schedule] updateSchedule ERROR ==========\n');
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const device = await Device.findById(schedule.deviceId);
    if (device.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Schedule.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
