require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mqtt = require('mqtt');

// Routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const templateRoutes = require('./routes/templateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mqttRoutes = require('./routes/mqttRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// MQTT Client
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost', {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 1000,
    clean: true,
});

mqttClient.on('connect', () => {
    console.log('MQTT Connected');
    // New topic structure: kaset/{template}/{serialNumber}/{zone}/{set|state}
    // Subscribe to both state/set topic shape and availability topic
    mqttClient.subscribe(['kaset/+/+/+/+', 'kaset/+/+/+'], (err, granted) => {
        if (!err) {
            console.log('Subscribed to MQTT topics:', granted.map(g => g.topic).join(', '));
        } else {
            console.error('MQTT subscribe error:', err);
        }
    });
});

mqttClient.on('error', (error) => {
    console.error('MQTT Error:', error);
});

mqttClient.on('disconnect', () => {
    console.log('MQTT Disconnected');
});

// Handle incoming MQTT messages: persist sensor/state messages and update device lastSeen
const Device = require('./models/Device');
const SensorReading = require('./models/SensorReading');

mqttClient.on('message', async (topic, message) => {
    const msg = message.toString();
    console.log(`Received message on topic ${topic}: ${msg}`);

    try {
        const parts = topic.split('/');
        if (parts[0] !== 'kaset') return;

        // Handle availability topic: kaset/{template}/{serial}/availability
        if (parts.length === 4 && parts[3] === 'availability') {
            const serial = parts[2];
            let payload = null;
            try { payload = JSON.parse(msg); } catch (e) { payload = msg; }
            const device = await Device.findOne({ serialNumber: serial });
            if (!device) {
                console.log('[MQTT] Unknown device serial for availability:', serial);
                return;
            }
            try {
                // Only accept explicit 'online' or 'offline' statuses (string) or { status: 'online' }
                let status = null;
                if (typeof payload === 'string') {
                    const s = payload.toLowerCase();
                    if (s === 'online' || s === 'offline') status = s;
                } else if (payload && typeof payload === 'object' && typeof payload.status === 'string') {
                    const s = payload.status.toLowerCase();
                    if (s === 'online' || s === 'offline') status = s;
                }

                if (!status) {
                    console.log('[MQTT] Ignoring availability payload (not online/offline):', payload);
                    return;
                }

                device.status = status;
                if (payload && payload.lastSeen) device.lastSeen = new Date(payload.lastSeen);
                else device.lastSeen = new Date();
                await device.save();
                console.log(`[MQTT] Updated availability for ${serial}: ${device.status}`);
            } catch (e) {
                console.error('[MQTT] Error updating device availability:', e);
            }
            return;
        }

        // Expect: kaset/{template}/{serial}/{zone}/{set|state}
        if (parts.length < 5) return;
        const templateName = parts[1];
        const serial = parts[2];
        const zone = parts[3];
        const action = parts[4]; // 'set' or 'state'

        let payload = null;
        try {
            payload = JSON.parse(msg);
        } catch (e) {
            // treat non-JSON payloads as plain strings (e.g., 'on'/'off' or numeric strings)
            payload = msg;
        }

        const device = await Device.findOne({ serialNumber: serial });
        if (!device) {
            console.log('[MQTT] Unknown device serial:', serial);
            return;
        }

        // Only persist 'state' messages from devices. Ignore 'set' (commands published by backend).
        if (action === 'state') {
            const RECENT_MS = 10000; // 10 seconds
            const recent = await SensorReading.findOne({ deviceId: device._id, topic: zone })
                .sort({ createdAt: -1 })
                .lean();

            if (recent && recent.source === 'web') {
                const age = Date.now() - new Date(recent.createdAt).getTime();
                if (age <= RECENT_MS) {
                    await SensorReading.findByIdAndUpdate(recent._id, {
                        $set: {
                            payload,
                            acknowledged: true,
                            acknowledgedBy: 'mqtt',
                            acknowledgedAt: new Date(),
                        },
                    });
                    console.log('[MQTT] Acknowledged recent web reading for', zone);
                    // acknowledged recent web reading; no device.states storage (persisted in SensorReading)
                } else {
                    const reading = new SensorReading({ deviceId: device._id, serialNumber: serial, topic: zone, payload, source: 'mqtt' });
                    await reading.save();
                    // persisted mqtt reading; no device.states storage
                }
            } else {
                const reading = new SensorReading({ deviceId: device._id, serialNumber: serial, topic: zone, payload, source: 'mqtt' });
                await reading.save();
                // persisted mqtt reading; no device.states storage
            }

            // Update lastSeen
            device.lastSeen = new Date();
            await device.save();
        } else {
            // action === 'set' or others - ignore incoming sets from devices (they should subscribe to these)
            console.log('[MQTT] Ignoring non-state message action:', action);
        }
    } catch (err) {
        console.error('[MQTT] Error handling message:', err);
    }
});

// Routes
app.get('/', (req, res) => {
    res.send('KasetIOT Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);

// Log for schedule routes
app.use('/api/devices/:deviceId/schedules', (req, res, next) => {
  console.log(`[Main] Schedule route matched: ${req.method} /api/devices/${req.params.deviceId}/schedules${req.path}`);
  next();
}, scheduleRoutes);

app.use('/api/templates', templateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mqtt', mqttRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
