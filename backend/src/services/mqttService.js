const mqtt = require('mqtt');

const publishMessage = (topic, payload) => {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost', {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  client.on('connect', () => {
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    client.publish(topic, message, { qos: 1 }, (err) => {
      if (!err) {
        console.log(`Message published to ${topic}`);
      } else {
        console.error('Error publishing:', err);
      }
      client.end();
    });
  });

  client.on('error', (error) => {
    console.error('MQTT Error:', error);
    client.end();
  });
};

module.exports = {
  publishMessage,
};
