const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      default: '',
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceTemplate',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Per-user visibility: users listed here won't see the device
    hiddenFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: Date,
    settings: {
      zones: [
        {
          id: String,
          name: String,
        },
      ],
      digitalSensors: [
        {
          id: String,
          name: String,
          onLabel: String,
          offLabel: String,
          icon: String,
          onColor: String,
          activeLow: Boolean,
        },
      ],
      analogSensors: [
        {
          id: String,
          name: String,
        },
      ],
      rs485Sensors: [
        {
          id: String,
          name: String,
        },
      ],
    },
    // states removed: sensor state persisted in SensorReading collection
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
