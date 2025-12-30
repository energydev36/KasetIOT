const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      enum: ['mqtt', 'web'],
      default: 'mqtt',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: {
      type: String,
      enum: ['mqtt', 'web', null],
      default: null,
    },
    acknowledgedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
