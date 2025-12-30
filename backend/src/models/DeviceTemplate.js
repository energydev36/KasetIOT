const mongoose = require('mongoose');

const deviceTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: String,
    // Enable/disable flags for each sensor type
    enabledSensors: {
      outputs: { type: Boolean, default: true },
      digitalSensors: { type: Boolean, default: true },
      analogSensors: { type: Boolean, default: true },
      rs485Sensors: { type: Boolean, default: true },
    },
    topics: {
      outputsBase: String,
      digitalSensorsBase: String,
      analogSensorsBase: String,
      rs485SensorsBase: String,
    },
    outputs: [
      {
        id: String,
        name: String,
        topic: String,
        type: {
          type: String,
          enum: ['digital', 'relay'],
          default: 'digital',
        },
      },
    ],
    digitalSensors: [
      {
        id: String,
        name: String,
        onLabel: { type: String, default: 'ON' },
        offLabel: { type: String, default: 'OFF' },
        icon: String,
        onColor: String,
        activeLow: { type: Boolean, default: false },
      },
    ],
    analogSensors: [
      {
        id: String,
        name: String,
        unit: String,
        minValue: Number,
        maxValue: Number,
      },
    ],
    rs485Sensors: [
      {
        id: String,
        name: String,
        address: Number,
        unit: String,
        baudRate: Number,
        dataFormat: String,
        topic: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeviceTemplate', deviceTemplateSchema);
