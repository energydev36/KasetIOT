const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    zone: {
      type: String,
      required: true,
    },
    round: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    startTime: {
      type: String, // HH:MM format
      required: true,
    },
    duration: {
      type: Number, // minutes
      required: true,
      min: 1,
    },
    days: [
      {
        type: String, // 'Mon', 'Tue', etc.
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Schedule', scheduleSchema);
