# KasetIOT Project Plan

This document outlines the structure and technology stack for the KasetIOT project.

## Project Overview
KasetIOT is a web-based platform for controlling IoT devices and monitoring data. It features user authentication and real-time device control using MQTT.

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Database:** MongoDB (for user data and device logs)
- **Communication:** MQTT (for real-time device control)
- **API:** RESTful API (Express.js recommended) for frontend communication

### Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS

## Features
1.  **User Authentication:**
    - Sign Up (Register)
    - Sign In (Login)
2.  **Dashboard:**
    - View added devices for basic status monitoring.
    - **Add Device:** Users must select a **Device Template** (created by Admin) and enter a valid **SerialNumber** (pre-registered in the system) to add a device.
3.  **Device Management (Device Detail):**
    - Accessed by clicking on a device from the Dashboard.
    - Interface and controls are based on the selected **Device Template**.
    - **Features:**
        - Control devices (On/Off).
        - View Digital Sensor status.
        - View Analog Sensor values.
        - View RS485 data.
    - **Sub-menus:**
        - **Schedule Settings (Timer):**
            - **Overview:** View list of set schedules with toggle to enable/disable specific schedules.
            - **Add Schedule:**
                1. Select Zone (Output) - Max limit based on Device Template.
                2. Select Cycle (Round) - Max 20 rounds/zone.
                3. Start Time (HH:MM).
                4. Duration (Minutes).
                5. Days of Week (Sun-Sat).
        - **Device Settings:**
            - **Group 1 (General Info):** WiFi Name, Signal Strength, Serial Number, Firmware Version.
            - **Group 2 (Naming):** Rename Device, Rename Output Zones.
            - **Group 3 (Digital Sensors):** Rename Sensor, Custom ON/OFF Labels, Select Icon, Select ON Color, Set Active Low/High.
            - **Group 4 (Analog Sensors):** Rename/Configure.
            - **Group 5 (RS485 Sensors):** Rename/Configure.
            - *(Note: Groups 2-5 availability depends on Device Template)*
4.  **Admin Panel:**
    - **Member Management:** View and manage all registered users.
    - **Global Device Management:** Oversee all devices in the system.
    - **Device Templates:** Create and manage device templates (presets) for users to easily add to their dashboards.

## Proposed Folder Structure
```
KasetIOT/
├── backend/                # Node.js Server
│   ├── src/
│   │   ├── config/         # DB & MQTT Config
│   │   ├── controllers/    # Route Logic
│   │   ├── models/         # MongoDB Schemas
│   │   ├── routes/         # API Routes
│   │   └── services/       # MQTT Service
│   ├── .env
│   └── package.json
│
└── frontend/               # Next.js Application
    ├── src/
    │   ├── app/            # Next.js App Router
    │   ├── components/     # Reusable UI Components
    │   └── lib/            # API & MQTT Clients
    ├── public/
    ├── tailwind.config.js
    └── package.json
```

## Next Steps
1. Initialize `backend` with Node.js and install dependencies (express, mongoose, mqtt, cors, dotenv).
2. Initialize `frontend` with Next.js and Tailwind CSS.
3. Set up MongoDB connection.
4. Set up MQTT broker connection.
5. Implement Authentication APIs.
6. Build Frontend UI.
