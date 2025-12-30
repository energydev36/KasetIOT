# MQTT Guide - KasetIOT Backend

นี่คือคู่มือการใช้งาน MQTT topics เพื่อควบคุมและรับข้อมูลจากอุปกรณ์ KasetIOT

## MQTT Topic Structure

### Topic Format
```
kaset/{serialNumber}/{zone}
```

- **kaset**: Root topic เพื่อรับประกาศ KasetIOT
- **{serialNumber}**: หมายเลขอุปกรณ์ (เช่น SDF23, KS001)
- **{zone}**: ชื่อโซน Output (เช่น output_1, output_2)

Important: Backend สมัครรับข้อความด้วย wildcard `kaset/+/+` ดังนั้นชื่อ topic ต้องมี 2 ส่วนหลัง `kaset/` เสมอ (เช่น `kaset/SDF23/output_1`, `kaset/SDF23/digital_1`) เพื่อให้ Backend รับได้แน่นอน

### ตัวอย่าง Topic
```
kaset/SDF23/output_1
kaset/KS001/output_1
```

---

## การส่งคำสั่งควบคุมจากส่วนติดต่อผู้ใช้ (Frontend)

### Endpoint
```
POST /api/mqtt/{deviceId}/control
```

### Request Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body
```json
{
  "zone": "output_1",
  "action": "on"
}
```

**Parameters:**
- `zone` (string): ชื่อ Output ที่ต้องการควบคุม (ต้องตรงกับที่กำหนดใน Device Template)
- `action` (string): คำสั่ง เช่น `on` หรือ `off`

### Response
```json
{
  "message": "Command sent",
  "topic": "kaset/SDF23/output_1",
  "payload": {
    "action": "on",
    "timestamp": "2025-12-29T08:36:50.353Z"
  }
}
```

### ตัวอย่าง cURL
```bash
curl -X POST http://localhost:5000/api/mqtt/6952321861e405167b9f68e6/control \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "output_1",
    "action": "on"
  }'
```

---

## การส่งข้อมูลจากอุปกรณ์ (Device → Backend)

อุปกรณ์ควรทั้ง Subscribe เพื่อรับคำสั่ง และ Publish เพื่อส่งสถานะ/ค่าจากเซนเซอร์กลับมายัง Backend ด้วยรูปแบบด้านล่าง

### 1) Subscribe เพื่อรับคำสั่ง

อุปกรณ์ต้อง subscribe ไปยัง topic เหล่านี้เพื่อรับคำสั่งจาก backend:

```
kaset/{serialNumber}/#
```

ตัวอย่าง:
```
kaset/SDF23/#
kaset/KS001/#
```

### Payload Format

Backend จะส่ง JSON payload ในรูปแบบนี้:

```json
{
  "action": "on",
  "timestamp": "2025-12-29T08:36:50.353Z"
}
```

**Fields:**
- `action` (string): คำสั่งที่ส่ง (on/off/...)
- `timestamp` (ISO 8601): เวลาที่ส่งคำสั่ง

### ตัวอย่าง Flow

1. **Frontend ส่งคำสั่ง:**
   ```
   POST /api/mqtt/6952321861e405167b9f68e6/control
   {
     "zone": "output_1",
     "action": "on"
   }
   ```

2. **Backend ยิง MQTT message:**
   ```
   Topic: kaset/SDF23/output_1
   Payload: {
     "action": "on",
     "timestamp": "2025-12-29T08:36:50.353Z"
   }
   ```

3. **อุปกรณ์รับข้อมูล:**
   - Device รับ message จาก topic `kaset/SDF23/output_1`
   - ประมวลผลข้อมูลและส่งคำสั่งไป Output #1
   - ส่งสถานะกลับไปยัง backend (ถ้าต้องการ)

---

### 2) Publish สถานะ Output (ยืนยันการทำงาน)

เมื่ออุปกรณ์ได้รับคำสั่งแล้ว ควรส่งสถานะปัจจุบันของ Output กลับมาที่ Backend เพื่อยืนยันผลลัพธ์

Topic:
```
kaset/{serialNumber}/{zone}-state
```

Payload ตัวอย่าง:
```json
{
  "state": "on",
  "timestamp": "2025-12-29T08:36:50.353Z"
}
```

ตัวอย่าง:
```
kaset/SDF23/output_1-state
```

หมายเหตุ: ใช้ชื่อ `{zone}` ให้ตรงกับ Template ที่ระบบกำหนด เช่น `output_1`, `output_2`

---

### 3) Publish ค่าจากเซนเซอร์

เนื่องจาก Backend สมัครรับด้วย `kaset/+/+` จึงกำหนดรูปแบบ topic สำหรับเซนเซอร์ให้มี 2 ส่วนตามนี้:

- Digital Sensor:
  - Topic: `kaset/{serialNumber}/digital_{id}`
  - Payload:
    ```json
    {
      "value": 0,
      "timestamp": "2025-12-29T08:40:00.000Z"
    }
    ```

- Analog Sensor:
  - Topic: `kaset/{serialNumber}/analog_{id}`
  - Payload:
    ```json
    {
      "value": 27.5,
      "unit": "%RH",
      "timestamp": "2025-12-29T08:40:00.000Z"
    }
    ```

- RS485 Sensor:
  - Topic: `kaset/{serialNumber}/rs485_{id}`
  - Payload (ตัวอย่าง):
    ```json
    {
      "values": { "temp": 26.3, "ph": 6.8 },
      "timestamp": "2025-12-29T08:40:00.000Z"
    }
    ```

ตัวอย่างจริง:
```
kaset/SDF23/digital_1
kaset/SDF23/analog_1
kaset/SDF23/rs485_1
```

คำแนะนำ:
- ใช้ `id` ให้ตรงกับการตั้งค่าที่หน้า Settings (เช่น `digitalSensors[i].id`)
- ค่า `value` ของ Digital ใช้ 0/1 ตาม active-low/active-high ที่ตั้งไว้

---

### 4) Publish สถานะระบบ (Heartbeat)

เพื่อช่วยให้ Backend ตรวจจับ online/offline อุปกรณ์ ควรส่ง heartbeat เป็นระยะๆ:

Topic:
```
kaset/{serialNumber}/status
```

Payload:
```json
{
  "online": true,
  "lastSeen": "2025-12-29T08:41:00.000Z"
}
```

---

## Environment Variables

ต้องกำหนดค่าเหล่านี้ใน `.env`:

```env
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_password
```

- **MQTT_BROKER_URL**: URL ของ MQTT Broker (เช่น Mosquitto)
- **MQTT_USERNAME**: ชื่อผู้ใช้ MQTT
- **MQTT_PASSWORD**: รหัสผ่าน MQTT

---

## การรับข้อมูล Sensor

### Endpoint
```
GET /api/mqtt/{deviceId}/sensors
```

### Request Headers
```
Authorization: Bearer {token}
```

### Response
```json
{
  "device": "6952321861e405167b9f68e6",
  "serialNumber": "SDF23",
  "sensors": []
}
```

**Note:** ปัจจุบันยังเป็น TODO - ต้องเพิ่ม logic เพื่อเก็บและดึงข้อมูล sensor จากอุปกรณ์

Backend (ใน `src/index.js`) subscribe ที่ `kaset/+/+` และจะเห็นข้อความทุกชนิดที่เข้าตามรูปแบบด้านบนใน console เพื่อสะดวกในการทดสอบเบื้องต้น

---

## Tips สำหรับผู้พัฒนา Device

1. **Subscribe ให้ครบ:**
   ```
   kaset/{serialNumber}/#
   ```
   ใช้ wildcard `#` เพื่อ catch ทุก topic ที่ขึ้นต้นด้วย `kaset/{serialNumber}/`

2. **Handle JSON Payload:**
   MQTT message จะมาในรูป JSON string ต้อง parse:
   ```python
   import json
   payload = json.loads(message.payload.decode())
   action = payload['action']
   timestamp = payload['timestamp']
   ```

3. **QoS Level:**
   Backend ใช้ QoS 1 - message จะส่งอย่างน้อย 1 ครั้ง (อาจได้มากกว่า 1 ครั้ง)

4. **Persistent Connection:**
   ต้อง keep MQTT connection ไว้ตลอดเวลา เพื่อรับข้อมูลได้เรื่อยๆ

5. **ข้อจำกัดจำนวน segment:**
   Backend รับที่ `kaset/+/+` จึงควรออกแบบ topic ให้เป็น 2 segment หลัง `kaset/` เสมอ (เช่น `kaset/SERIAL/digital_1`) เพื่อให้เข้ากับระบบปัจจุบัน

---

## Troubleshooting

### Device ไม่ได้รับ Message
- ✓ ตรวจสอบว่า MQTT Broker กำลังรัน
- ✓ ตรวจสอบ MQTT_BROKER_URL, username, password ถูกต้อง
- ✓ ตรวจสอบว่า Device subscribe ถูก topic
- ✓ ดู MQTT Broker logs

### Backend ไม่สามารถส่ง Message
- ✓ ตรวจสอบ `/api/mqtt/{deviceId}/control` endpoint ทำงาน (ดู response)
- ✓ ตรวจสอบ Token ถูกต้อง (Authorization header)
- ✓ ตรวจสอบ deviceId และ zone มีอยู่จริง

### Topic ไม่ตรง
- ✓ ต้องใช้ `serialNumber` ของอุปกรณ์ (จากการสมัครอุปกรณ์)
- ✓ ต้องใช้ `zone` ชื่อเดียวกับที่กำหนดใน Device Template

---

## ตัวอย่าง Device Code (Python)

```python
import paho.mqtt.client as mqtt
import json
import os

MQTT_BROKER = os.getenv('MQTT_BROKER_URL', 'localhost')
MQTT_USER = os.getenv('MQTT_USERNAME', 'user')
MQTT_PASS = os.getenv('MQTT_PASSWORD', 'pass')
DEVICE_SERIAL = "SDF23"  # Serial number ของอุปกรณ์

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # Subscribe ไปยัง topic ควบคุมอุปกรณ์
    client.subscribe(f"kaset/{DEVICE_SERIAL}/#")

def on_message(client, userdata, msg):
    print(f"Topic: {msg.topic}")
    try:
        payload = json.loads(msg.payload.decode())
        action = payload['action']
        timestamp = payload['timestamp']
        print(f"Action: {action}, Timestamp: {timestamp}")
        # ทำการประมวลผลคำสั่ง
        if action == "on":
            print("Turning ON output")
        elif action == "off":
            print("Turning OFF output")
    except Exception as e:
        print(f"Error parsing message: {e}")

client = mqtt.Client()
client.username_pw_set(MQTT_USER, MQTT_PASS)
client.on_connect = on_connect
client.on_message = on_message

client.connect(MQTT_BROKER, 1883, 60)
client.loop_forever()
```

---

## ติดต่อ Support

หากมีปัญหา โปรดติดต่อ engineering team
