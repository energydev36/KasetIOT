"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import * as api from "@/lib/api";
import { IconRegistry } from "@/components/IconSelector";

// Module-scoped in-memory request dedupe caches to survive remounts in StrictMode
const deviceFetchCache: Record<string, Promise<any> | undefined> = {};
const sensorFetchCache: Record<string, Promise<any> | undefined> = {};

interface DeviceTemplate {
  _id: string;
  name: string;
  description: string;
  outputs: any[];
  digitalSensors: any[];
  analogSensors: any[];
  rs485Sensors: any[];
  topics?: {
    outputsBase?: string;
    digitalSensorsBase?: string;
    analogSensorsBase?: string;
    rs485SensorsBase?: string;
  };
}

interface Device {
  _id: string;
  serialNumber: string;
  name: string;
  status: "online" | "offline";
  templateId: DeviceTemplate;
  lastSeen?: string;
  settings?: any;
}

export default function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [controlledStates, setControlledStates] = useState<
    Record<string, string>
  >({});
  const [sensorData, setSensorData] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const fetchInProgressRef = React.useRef(false);
  const intervalRef = React.useRef<number | null>(null);
  const pendingCommandsRef = React.useRef<Record<string, { originalState: string; timeoutId: number }>>({});

  const deriveOutputTopic = (output: any, index: number, tplTopics?: any) => {
    const base = tplTopics?.outputsBase;
    if (base) return `${base}${index + 1}`;
    return output.topic || output.id;
  };

  const deriveDigitalTopic = (sensor: any, index: number, tplTopics?: any) => {
    const base = tplTopics?.digitalSensorsBase;
    if (base) return `${base}${index + 1}`;
    return sensor.topic || sensor.id;
  };

  const deriveAnalogTopic = (sensor: any, index: number, tplTopics?: any) => {
    const base = tplTopics?.analogSensorsBase;
    if (base) return `${base}${index + 1}`;
    return sensor.topic || sensor.id;
  };

  const deriveRs485Topic = (sensor: any, index: number, tplTopics?: any) => {
    const base = tplTopics?.rs485SensorsBase;
    if (base) return `${base}${index + 1}`;
    return sensor.topic || sensor.id;
  };

  // Merge template settings with device-specific overrides
  const mergeWithSettings = (templateItems: any[] = [], settingsItems: any[] = []) => {
    const settingsMap: Record<string, any> = {};
    settingsItems.forEach((item) => {
      if (item && item.id) {
        settingsMap[item.id] = item;
      }
    });

    return templateItems.map((templateItem) => {
      const override = settingsMap[templateItem.id] || {};
      return { ...templateItem, ...override };
    });
  };

  // Load device data
  useEffect(() => {
    document.title = "รายละเอียดอุปกรณ์ - KasetIOT";
    
    let isInitialLoad = true;
    let isMounted = true;

    // Try to use cached data for instant render
    try {
      // First try sessionStorage (from dashboard click)
      let cachedData = null;
      const sessionStr = sessionStorage.getItem(`devicePrefetch:${id}`);
      if (sessionStr) {
        cachedData = JSON.parse(sessionStr);
      } else {
        // Fall back to localStorage (for direct access or back navigation)
        const localStr = localStorage.getItem(`deviceCache:${id}`);
        if (localStr) {
          cachedData = JSON.parse(localStr);
        }
      }

      if (cachedData) {
        const age = Date.now() - (cachedData.timestamp || 0);
        // Use cached data if less than 30 seconds old
        if (age < 30000) {
          console.log('[Device] Using cached data (age:', Math.round(age / 1000), 'seconds)');
          setDevice(cachedData.device);
          if (cachedData.sensorData) {
            setSensorData(cachedData.sensorData);
            
            // Restore controlled states from cached sensor data
            try {
              const tplTopics = cachedData.device?.templateId?.topics;
              const tplOutputs = cachedData.device?.templateId?.outputs || [];
              const settingsOutputs = cachedData.device?.settings?.outputs || [];
              const settingsMap: Record<string, any> = {};
              settingsOutputs.forEach((item: any) => {
                if (item && item.id) settingsMap[item.id] = item;
              });
              
              const states: Record<string, string> = {};
              tplOutputs.forEach((output: any, idx: number) => {
                const merged = { ...output, ...(settingsMap[output.id] || {}) };
                const topicKey = deriveOutputTopic(merged, idx, tplTopics);
                const statesSource = cachedData.sensorData.states || cachedData.sensorData.sensorReadings || {};
                const val = statesSource[topicKey];
                
                if (typeof val !== 'undefined') {
                  let normalizedVal: string;
                  if (typeof val === 'string') {
                    normalizedVal = val === 'on' || val === '1' ? 'on' : val === 'off' || val === '0' ? 'off' : val;
                  } else if (typeof val === 'number') {
                    normalizedVal = val === 1 ? 'on' : 'off';
                  } else if (typeof val === 'boolean') {
                    normalizedVal = val ? 'on' : 'off';
                  } else {
                    normalizedVal = 'off';
                  }
                  states[topicKey] = normalizedVal;
                } else {
                  states[topicKey] = 'off';
                }
              });
              setControlledStates(states);
            } catch (e) {
              console.warn('[Device] Error restoring states from cache:', e);
            }
          }
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn('[Device] Failed to read cached data:', e);
    }

    const loadDeviceData = async () => {
      if (fetchInProgressRef.current) return; // avoid overlapping fetches
      fetchInProgressRef.current = true;
      try {
        // Only show loading state on initial load
        if (isInitialLoad) {
          setLoading(true);
        }
        setError("");
        const token = localStorage.getItem("token") || "";

        console.log("[Device] Loading device data for ID:", id);

        // Get device details ONLY on initial load
        let response;
        if (isInitialLoad) {
          if (deviceFetchCache[id]) {
            response = await deviceFetchCache[id];
          } else {
            const p = api.deviceAPI.getDeviceDetail(token, id).finally(() => {
              // expire cache after short TTL
              setTimeout(() => delete deviceFetchCache[id], 3000);
            });
            deviceFetchCache[id] = p;
            response = await p;
          }
          console.log("[Device] Device details response:", response);
          
          if (!isMounted) return;
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          setDevice(response.device);

          // Initialize controlled states from merged outputs (template + settings) on first load
          if (response.device?.templateId?.outputs) {
            const tplTopics = response.device.templateId?.topics;
            const states: Record<string, string> = {};
            const tplOutputs = response.device.templateId.outputs || [];
            const settingsOutputs = response.device.settings?.outputs || [];
            const settingsMap: Record<string, any> = {};
            settingsOutputs.forEach((item: any) => {
              if (item && item.id) settingsMap[item.id] = item;
            });
            tplOutputs.forEach((output: any, idx: number) => {
              const merged = { ...output, ...(settingsMap[output.id] || {}) };
              const topicKey = deriveOutputTopic(merged, idx, tplTopics);
              states[topicKey] = "off";
            });
            if (Object.keys(controlledStates).length === 0) {
              setControlledStates(states);
            }
          }
        }

        // Get sensor data (always poll this for updates)
        await loadSensorData(response ? response.device : undefined);
      } catch (err) {
        console.error("[Device] Error loading device:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load device"
          );
        }
      } finally {
        fetchInProgressRef.current = false;
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
          // Clear prefetch cache once initial load completes
          try { sessionStorage.removeItem(`devicePrefetch:${id}`); } catch {}
        }
      }
    };

    const loadSensorData = async (deviceData?: any) => {
      try {
        const token = localStorage.getItem("token") || "";
        let sensorResponse;
        const sensorUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/mqtt/${id}/sensors`;
        if (sensorFetchCache[sensorUrl]) {
          sensorResponse = await sensorFetchCache[sensorUrl];
        } else {
          const p = fetch(sensorUrl, { headers: { Authorization: `Bearer ${token}` } }).finally(() => {
            setTimeout(() => delete sensorFetchCache[sensorUrl], 3000);
          });
          sensorFetchCache[sensorUrl] = p;
          sensorResponse = await p;
        }
        console.log("[Device] Sensor data response status:", sensorResponse.status);
        
        if (sensorResponse.ok) {
          const data = await sensorResponse.json();
          console.log("[Device] Sensor data:", data);
          console.log("[Device] Latest readings with source:", data.latest);
          
          // Use passed deviceData or fallback to device state
          const currentDevice = deviceData || device;
          console.log("[Device] Current device state:", currentDevice ? `${currentDevice.name} (has template: ${!!currentDevice.templateId})` : "null");
          if (isMounted) {
            setSensorData(data);
              
              // Update cache with fresh data (only if device is already loaded)
              if (currentDevice) {
                try {
                  const cacheData = {
                    device: currentDevice,
                    sensorData: data,
                    timestamp: Date.now(),
                  };
                  localStorage.setItem(`deviceCache:${id}`, JSON.stringify(cacheData));
                } catch (e) {
                  console.warn('[Device] Failed to update cache:', e);
                }
              }

              // derive controlledStates from sensor data (prefer device.states, then sensorReadings)
              // Only update if values actually changed to prevent button flickering
              if (currentDevice?.templateId) {
                console.log('[Control] Device has template, processing states...');
                try {
                  const tplTopics = currentDevice.templateId?.topics;
                  const tplOutputs = currentDevice.templateId?.outputs || [];
                  const settingsOutputs = currentDevice.settings?.outputs || [];
                  const settingsMap: Record<string, any> = {};
                  settingsOutputs.forEach((item: any) => {
                    if (item && item.id) settingsMap[item.id] = item;
                  });
                  const newStates = { ...tplOutputs.reduce((acc: any, out: any, idx: number) => {
                    const merged = { ...out, ...(settingsMap[out.id] || {}) };
                    const topicKey = deriveOutputTopic(merged, idx, tplTopics);
                    acc[topicKey] = 'off';
                    return acc;
                }, {}) };
                const statesSource = data.states || data.sensorReadings || {};
                console.log('[Control] Expected topic keys:', Object.keys(newStates));
                console.log('[Control] Polling received sensor data:', statesSource);
                console.log('[Control] Current pending commands:', Object.keys(pendingCommandsRef.current));
                
                // Build a map of topic -> source from latest readings
                const sourceMap: Record<string, string> = {};
                if (data.latest && Array.isArray(data.latest)) {
                  data.latest.forEach((reading: any) => {
                    const topic = reading.topic;
                    if (topic) {
                      // Remove -state suffix for matching
                      const key = topic.replace(/-state$/, '');
                      sourceMap[key] = reading.source || 'unknown';
                    }
                  });
                }
                console.log('[Control] Source map:', sourceMap);
                
                let hasChanges = false;
                
                setControlledStates((prevStates) => {
                  console.log('[Control] Previous states:', prevStates);
                  Object.keys(newStates).forEach((outId) => {
                    const val = statesSource[outId];
                    console.log(`[Control] Processing ${outId}: value from sensor =`, val);
                    if (typeof val !== 'undefined') {
                      // normalize boolean/number/string
                      let normalizedVal: string;
                      if (typeof val === 'string') {
                        normalizedVal = val === 'on' || val === '1' ? 'on' : val === 'off' || val === '0' ? 'off' : val;
                      } else if (typeof val === 'number') {
                        normalizedVal = val === 1 ? 'on' : 'off';
                      } else if (typeof val === 'boolean') {
                        normalizedVal = val ? 'on' : 'off';
                      } else if (val && val.state) {
                        normalizedVal = val.state === 'on' ? 'on' : 'off';
                      } else {
                        normalizedVal = String(val);
                      }
                      
                      // If we have a pending command for this output, check if device confirmed the change
                      if (pendingCommandsRef.current[outId]) {
                        const pendingCmd = pendingCommandsRef.current[outId];
                        const source = sourceMap[outId] || 'unknown';
                        
                        // Only clear pending command if:
                        // 1. State changed from original (device responded)
                        // 2. AND source is NOT 'web' (not just our own echo)
                        if (normalizedVal !== pendingCmd.originalState && source !== 'web') {
                          console.log(`[Control] Device confirmed state change for ${outId}: ${pendingCmd.originalState} → ${normalizedVal} (source: ${source})`);
                          clearTimeout(pendingCmd.timeoutId);
                          delete pendingCommandsRef.current[outId];
                        } else if (source === 'web') {
                          console.log(`[Control] Ignoring web-sourced reading for ${outId}, waiting for device confirmation`);
                        } else {
                          console.log(`[Control] Device hasn't responded yet for ${outId}, still at original state: ${normalizedVal} (source: ${source})`);
                        }
                      }
                      
                      newStates[outId] = normalizedVal;
                      
                      // Only mark as changed if value differs from previous
                      if (prevStates[outId] !== normalizedVal) {
                        console.log(`[Control] State changed for ${outId}: ${prevStates[outId]} → ${normalizedVal}`);
                        hasChanges = true;
                      }
                    }
                  });
                  
                  console.log('[Control] Has changes:', hasChanges);
                  console.log('[Control] New states:', newStates);
                  
                  // Only update state if something actually changed
                  if (hasChanges) {
                    return newStates;
                  }
                  return prevStates;
                });
                } catch (e) {
                  console.error('[Device] Error deriving controlledStates from sensor data:', e);
                }
              } else {
                console.log('[Control] Device or templateId not available yet, skipping state update');
              }
            }
          } else {
            console.log("[Device] Sensor data not available:", sensorResponse.statusText);
          }
        } catch (err) {
          console.log("[Device] Sensor data fetch error:", err);
        }
      };

    loadDeviceData();

    // Poll for sensor updates every 5 seconds (after initial load)
    // Only fetch sensor data in polling, not device details
    intervalRef.current = window.setInterval(() => {
      if (!isInitialLoad) {
        loadSensorData();
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clean up any pending command timeouts
      Object.values(pendingCommandsRef.current).forEach(({ timeoutId }) => {
        clearTimeout(timeoutId);
      });
      pendingCommandsRef.current = {};
    };
  }, [id]);

  const handleControlOutput = async (
    outputTopic: string,
    currentState: string
  ) => {
    try {
      const token = localStorage.getItem("token") || "";
      const newState = currentState === "on" ? "off" : "on";
      const originalState = currentState;

      console.log(`[Control] Sending command: ${outputTopic} ${originalState} → ${newState}`);

      // Optimistically update local state
      setControlledStates((prev) => ({
        ...prev,
        [outputTopic]: newState,
      }));

      // Set timeout to revert if device doesn't respond within 5 seconds
      const timeoutId = window.setTimeout(() => {
        // Revert to original state if device hasn't confirmed the change
        if (pendingCommandsRef.current[outputTopic]) {
          console.log(`[Control] Timeout - reverting ${outputTopic} from ${newState} to ${originalState}`);
          delete pendingCommandsRef.current[outputTopic];
          setControlledStates((prev) => ({
            ...prev,
            [outputTopic]: originalState,
          }));
          setSuccessMessage("");
        }
      }, 5000);

      // Track pending command
      pendingCommandsRef.current[outputTopic] = {
        originalState,
        timeoutId,
      };

      // Send control command to backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/mqtt/${id}/control`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            zone: outputTopic,
            action: newState,
          }),
        }
      );

      if (!response.ok) {
        // Command failed, immediately revert
        if (pendingCommandsRef.current[outputTopic]) {
          clearTimeout(pendingCommandsRef.current[outputTopic].timeoutId);
          delete pendingCommandsRef.current[outputTopic];
        }
        setControlledStates((prev) => ({
          ...prev,
          [outputTopic]: originalState,
        }));
        throw new Error("Failed to control device");
      }

      setSuccessMessage("ส่งคำสั่งเรียบร้อย ✓");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to control output");
    }
  };

  // Show not found only when an actual error occurred
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">ไม่พบอุปกรณ์</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            กลับไปแดชบอร์ด
          </button>
        </div>
      </div>
    );
  }

  // Don't show full loading screen - let cached data render with inline loading indicator
  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">กำลังโหลดข้อมูลอุปกรณ์...</p>
        </div>
      </div>
    );
  }

  const template = device.templateId as DeviceTemplate;

  // Get zone names from settings
  const zones = device.settings?.zones || [];
  const zoneNameMap: Record<string, string> = {};
  zones.forEach((zone: any) => {
    if (zone && zone.id && zone.name) {
      zoneNameMap[zone.id] = zone.name;
    }
  });

  // Merge template with device settings to get final configuration
  const mergedOutputs = mergeWithSettings(
    template?.outputs || [],
    device.settings?.outputs || []
  );
  const mergedDigitalSensors = mergeWithSettings(
    template?.digitalSensors || [],
    device.settings?.digitalSensors || []
  );
  const mergedAnalogSensors = mergeWithSettings(
    template?.analogSensors || [],
    device.settings?.analogSensors || []
  );
  const mergedRs485Sensors = mergeWithSettings(
    template?.rs485Sensors || [],
    device.settings?.rs485Sensors || []
  );

  const userStr = localStorage.getItem("user");
  const userRole = userStr ? JSON.parse(userStr).role : undefined;

  return (
    <SidebarLayout userRole={userRole}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← กลับ
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{device.name}</h1>
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">กำลังโหลด...</span>
              </div>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  device.status === "online"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {device.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Output Controls */}
            {mergedOutputs && mergedOutputs.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">การควบคุม</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mergedOutputs.map((output, idx) => {
                    const tplTopics = template?.topics;
                    const topicKey = deriveOutputTopic(output, idx, tplTopics);
                    const stateVal = controlledStates[topicKey];
                    return (
                    <div
                      key={output.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow dark:bg-gray-700"
                    >
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-white">
                          {zoneNameMap[output.id] || output.name}
                        </h3>
                        <p
                          className={`text-sm ${
                            controlledStates[output.id] === "on"
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {stateVal === "on"
                            ? "เปิด"
                            : "ปิด"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Type: {output.type}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleControlOutput(topicKey, stateVal)
                        }
                        disabled={device.status !== "online"}
                        className={`w-14 h-8 rounded-full transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed ${
                          stateVal === "on"
                            ? "bg-green-600"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            stateVal === "on"
                              ? "translate-x-7"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Digital Sensors */}
            {mergedDigitalSensors && mergedDigitalSensors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เซนเซอร์ดิจิทัล</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mergedDigitalSensors.map((sensor, idx) => {
                    const tplTopics = template?.topics;
                    const topicKey = deriveDigitalTopic(sensor, idx, tplTopics);
                    const readingVal = sensorData?.sensorReadings?.[topicKey];
                    
                    // Normalize reading value to on/off string (don't flip based on activeLow)
                    let displayState = "off";
                    if (typeof readingVal !== "undefined") {
                      if (typeof readingVal === 'string') {
                        displayState = readingVal.toLowerCase() === 'on' || readingVal === '1' ? 'on' : 'off';
                      } else if (typeof readingVal === 'number') {
                        displayState = readingVal === 1 ? 'on' : 'off';
                      } else if (typeof readingVal === 'boolean') {
                        displayState = readingVal ? 'on' : 'off';
                      }
                    }
                    
                    const isOn = displayState === 'on';
                    const IconComponent = sensor.icon && IconRegistry[sensor.icon] 
                      ? IconRegistry[sensor.icon] 
                      : null;
                    
                    return (
                    <div
                      key={sensor.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {IconComponent && <IconComponent size={20} className="text-gray-600 dark:text-gray-400" />}
                        <h3 className="font-medium text-gray-800 dark:text-white">
                          {sensor.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 capitalize">
                        Digital Sensor {sensor.activeLow ? "(Active Low)" : "(Active High)"}
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Topic: {topicKey}
                        </div>
                        {typeof readingVal !== "undefined" && (
                          <div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                sensor.onColor && isOn
                                  ? `text-white`
                                  : isOn
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                              }`}
                              style={
                                sensor.onColor && isOn
                                  ? { backgroundColor: sensor.onColor }
                                  : {}
                              }
                            >
                              {isOn ? (sensor.onLabel || "ON") : (sensor.offLabel || "OFF")}
                            </span>
                          </div>
                        )}
                        {typeof readingVal === "undefined" && (
                          <div className="text-sm text-gray-400 dark:text-gray-500">
                            ไม่มีข้อมูล
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analog Sensors */}
            {mergedAnalogSensors && mergedAnalogSensors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เซนเซอร์แอนะล็อก</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mergedAnalogSensors.map((sensor, idx) => {
                    const tplTopics = template?.topics;
                    const topicKey = deriveAnalogTopic(sensor, idx, tplTopics);
                    const readingVal = sensorData?.sensorReadings?.[topicKey];
                    const IconComponent = sensor.icon && IconRegistry[sensor.icon] 
                      ? IconRegistry[sensor.icon] 
                      : null;
                    return (
                      <div
                        key={sensor.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {IconComponent && <IconComponent size={20} className="text-gray-600 dark:text-gray-400" />}
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {sensor.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Analog Sensor
                        </p>
                        <div className="mt-3">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            ช่วง: {sensor.minValue} - {sensor.maxValue}{" "}
                            {sensor.unit}
                          </div>
                          {typeof readingVal !== "undefined" && (
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {readingVal}
                              <span className="text-sm text-gray-600 ml-1">
                                {sensor.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RS485 Sensors */}
            {mergedRs485Sensors && mergedRs485Sensors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เซนเซอร์ RS485</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mergedRs485Sensors.map((sensor, idx) => {
                    const tplTopics = template?.topics;
                    const topicKey = deriveRs485Topic(sensor, idx, tplTopics);
                    const readingVal = sensorData?.sensorReadings?.[topicKey];
                    const IconComponent = sensor.icon && IconRegistry[sensor.icon] 
                      ? IconRegistry[sensor.icon] 
                      : null;
                    return (
                      <div
                        key={sensor.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {IconComponent && <IconComponent size={20} className="text-gray-600 dark:text-gray-400" />}
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {sensor.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          RS485 Sensor
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>Topic: {topicKey}</div>
                          {typeof sensor.address !== "undefined" && <div>Address: {sensor.address}</div>}
                          {sensor.unit && <div>Unit: {sensor.unit}</div>}
                          {typeof readingVal !== "undefined" && (
                            <div className="text-base font-semibold text-blue-600 dark:text-blue-400">
                              Value: {readingVal} {sensor.unit || ""}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Device Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ข้อมูลอุปกรณ์</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">หมายเลขอุปกรณ์</p>
                  <p className="font-medium font-mono text-gray-900 dark:text-white">{device.serialNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">เทมเพลต</p>
                  <p className="font-medium text-gray-900 dark:text-white">{template?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">สถานะ</p>
                  <p
                    className={`font-medium ${
                      device.status === "online"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {device.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
                  </p>
                </div>
                {device.lastSeen && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">ออนไลน์ล่าสุด</p>
                    <p className="font-medium text-xs text-gray-900 dark:text-white">
                      {new Date(device.lastSeen).toLocaleString("th-TH")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Template Info */}
            {template && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เทมเพลต</h2>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {template.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Output:</span>
                      <span className="font-medium">
                        {template.outputs?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Digital:</span>
                      <span className="font-medium">
                        {template.digitalSensors?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analog:</span>
                      <span className="font-medium">
                        {template.analogSensors?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>RS485:</span>
                      <span className="font-medium">
                        {template.rs485Sensors?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เมนู</h2>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    router.push(`/device/${device._id}/schedule`)
                  }
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  ⏰ ตั้งเวลา
                </button>
                <button
                  onClick={() =>
                    router.push(`/device/${device._id}/settings`)
                  }
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  ⚙️ ตั้งค่า
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </SidebarLayout>
  );
}
