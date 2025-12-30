"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import IconSelector from "@/components/IconSelector";
import * as api from "@/lib/api";

interface DeviceTemplate {
  _id: string;
  name: string;
  description?: string;
  outputs: any[];
  digitalSensors: any[];
  analogSensors: any[];
  rs485Sensors: any[];
}

interface Device {
  _id: string;
  serialNumber: string;
  name: string;
  status: "online" | "offline";
  templateId: DeviceTemplate;
  settings?: any;
}

export default function DeviceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
    const router = useRouter();

    const [device, setDevice] = useState<Device | null>(null);
    const [deviceName, setDeviceName] = useState("");
    const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
    const [digitalSensors, setDigitalSensors] = useState<any[]>([]);
    const [analogSensors, setAnalogSensors] = useState<any[]>([]);
    const [rs485Sensors, setRs485Sensors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
      document.title = "ตั้งค่าอุปกรณ์ - KasetIOT";
      
      const fetchData = async () => {
        try {
          setLoading(true);
          setError("");
          const token = localStorage.getItem("token") || "";
          const response = await api.deviceAPI.getDeviceDetail(token, id);
          const dev = response.device as Device;
          setDevice(dev);
          setDeviceName(dev.name || "");

          const template = dev.templateId as DeviceTemplate;

          const zonesFromSettings =
            dev.settings?.zones && dev.settings.zones.length > 0
              ? dev.settings.zones
              : template.outputs?.map((o: any) => ({ id: o.id, name: o.name })) || [];
          setZones(zonesFromSettings);

          const digitalFromSettings =
            dev.settings?.digitalSensors && dev.settings.digitalSensors.length > 0
              ? dev.settings.digitalSensors
              : template.digitalSensors || [];
          setDigitalSensors(digitalFromSettings);

          const analogFromSettings =
            dev.settings?.analogSensors && dev.settings.analogSensors.length > 0
              ? dev.settings.analogSensors
              : template.analogSensors || [];
          setAnalogSensors(analogFromSettings);

          const rs485FromSettings =
            dev.settings?.rs485Sensors && dev.settings.rs485Sensors.length > 0
              ? dev.settings.rs485Sensors
              : template.rs485Sensors || [];
          setRs485Sensors(rs485FromSettings);
        } catch (err) {
          setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [id]);

    const handleSave = async () => {
      try {
        setSaving(true);
        setError("");
        const token = localStorage.getItem("token") || "";

        if (deviceName.trim()) {
          await api.deviceAPI.updateDeviceName(token, id, deviceName.trim());
        }

        const payload = {
          zones: zones.map((z) => ({ id: z.id, name: z.name || z.id })),
          digitalSensors: digitalSensors.filter((s) => (s.name || "").trim()),
          analogSensors: analogSensors.filter((s) => (s.name || "").trim()),
          rs485Sensors: rs485Sensors.filter((s) => (s.name || "").trim()),
        };

        await api.deviceAPI.updateDeviceSettings(token, id, payload);

        setSuccessMessage("บันทึกการตั้งค่าแล้ว ✓");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      } finally {
        setSaving(false);
      }
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">กำลังโหลดการตั้งค่า...</p>
        </div>
      );
    }

    if (!device) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-red-600">ไม่พบอุปกรณ์</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              กลับแดชบอร์ด
            </button>
          </div>
        </div>
      );
    }

    const template = device.templateId as DeviceTemplate;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const userRole = userStr ? JSON.parse(userStr).role : undefined;

    return (
      <SidebarLayout userRole={userRole}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
            <button
              onClick={() => router.push(`/device/${id}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← กลับ
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">ตั้งค่าอุปกรณ์</h1>
          </div>

          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200">
                {successMessage}
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ข้อมูลอุปกรณ์</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                      device.status === "online" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {device.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ชื่ออุปกรณ์</h2>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="ตั้งชื่ออุปกรณ์"
                />
              </div>

              {zones.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold mb-2 text-gray-900 dark:text-white">ชื่อโซน Output</h3>
                  <div className="space-y-3">
                    {zones.map((zone, index) => (
                      <div key={zone.id} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-24">โซน {index + 1}</span>
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) =>
                            setZones(
                              zones.map((z) =>
                                z.id === zone.id ? { ...z, name: e.target.value } : z
                              )
                            )
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {digitalSensors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เซนเซอร์ Digital</h2>
                <div className="space-y-6">
                  {digitalSensors.map((sensor, idx) => (
                    <div key={sensor.id || idx} className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อเซนเซอร์</label>
                          <input
                            type="text"
                            value={sensor.name || ""}
                            onChange={(e) =>
                              setDigitalSensors(
                                digitalSensors.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                          <IconSelector
                            value={sensor.icon || ""}
                            onChange={(value) =>
                              setDigitalSensors(
                                digitalSensors.map((s, i) => (i === idx ? { ...s, icon: value } : s))
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อตอน ON</label>
                          <input
                            type="text"
                            value={sensor.onLabel || ""}
                            onChange={(e) =>
                              setDigitalSensors(
                                digitalSensors.map((s, i) => (i === idx ? { ...s, onLabel: e.target.value } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อตอน OFF</label>
                          <input
                            type="text"
                            value={sensor.offLabel || ""}
                            onChange={(e) =>
                              setDigitalSensors(
                                digitalSensors.map((s, i) => (i === idx ? { ...s, offLabel: e.target.value } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">สีตอน ON</label>
                          <input
                            type="color"
                            value={sensor.onColor || "#10b981"}
                            onChange={(e) =>
                              setDigitalSensors(
                                digitalSensors.map((s, i) => (i === idx ? { ...s, onColor: e.target.value } : s))
                              )
                            }
                            className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">โหมดทำงาน</label>
                          <select
                            value={sensor.activeLow ? "low" : "high"}
                            onChange={(e) =>
                              setDigitalSensors(
                                digitalSensors.map((s, i) => (i === idx ? { ...s, activeLow: e.target.value === "low" } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="high">Active HIGH</option>
                            <option value="low">Active LOW</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analogSensors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เซนเซอร์ Analog</h2>
                <div className="space-y-6">
                  {analogSensors.map((sensor, idx) => (
                    <div key={sensor.id || idx} className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อเซนเซอร์</label>
                          <input
                            type="text"
                            value={sensor.name || ""}
                            onChange={(e) =>
                              setAnalogSensors(
                                analogSensors.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                          <IconSelector
                            value={sensor.icon || ""}
                            onChange={(value) =>
                              setAnalogSensors(
                                analogSensors.map((s, i) => (i === idx ? { ...s, icon: value } : s))
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">หน่วยวัด</label>
                          <input
                            type="text"
                            value={sensor.unit || ""}
                            onChange={(e) =>
                              setAnalogSensors(
                                analogSensors.map((s, i) => (i === idx ? { ...s, unit: e.target.value } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ค่า Min</label>
                          <input
                            type="number"
                            value={sensor.minValue ?? 0}
                            onChange={(e) =>
                              setAnalogSensors(
                                analogSensors.map((s, i) =>
                                  i === idx ? { ...s, minValue: parseFloat(e.target.value) || 0 } : s
                                )
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ค่า Max</label>
                          <input
                            type="number"
                            value={sensor.maxValue ?? 100}
                            onChange={(e) =>
                              setAnalogSensors(
                                analogSensors.map((s, i) =>
                                  i === idx ? { ...s, maxValue: parseFloat(e.target.value) || 0 } : s
                                )
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark-border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rs485Sensors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">เซนเซอร์ RS485</h2>
                <div className="space-y-6">
                  {rs485Sensors.map((sensor, idx) => (
                    <div key={sensor.id || idx} className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อเซนเซอร์</label>
                          <input
                            type="text"
                            value={sensor.name || ""}
                            onChange={(e) =>
                              setRs485Sensors(
                                rs485Sensors.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                          <IconSelector
                            value={sensor.icon || ""}
                            onChange={(value) =>
                              setRs485Sensors(
                                rs485Sensors.map((s, i) => (i === idx ? { ...s, icon: value } : s))
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                          <input
                            type="number"
                            value={sensor.address ?? 1}
                            onChange={(e) =>
                              setRs485Sensors(
                                rs485Sensors.map((s, i) =>
                                  i === idx ? { ...s, address: parseInt(e.target.value) || 1 } : s
                                )
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">หน่วยวัด</label>
                          <input
                            type="text"
                            value={sensor.unit || ""}
                            onChange={(e) =>
                              setRs485Sensors(
                                rs485Sensors.map((s, i) => (i === idx ? { ...s, unit: e.target.value } : s))
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-red-200 dark:border-red-800">
              <h2 className="text-lg font-semibold mb-4 text-red-700 dark:text-red-400">ลบอุปกรณ์</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                การลบจะทำให้อุปกรณ์นี้ไม่แสดงใน Dashboard ของคุณ แต่ยังคงอยู่ในระบบและผู้ดูแล (Admin) ยังสามารถมองเห็นได้
              </p>
              <button
                onClick={async () => {
                  if (!confirm("คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์นี้?")) return;
                  try {
                    const token = localStorage.getItem("token") || "";
                    const res = await api.deviceAPI.hideDeviceForUser(token, id);
                    if (res.message) {
                      setSuccessMessage("ลบอุปกรณ์เรียบร้อย ✓");
                      setTimeout(() => setSuccessMessage(""), 3000);
                      router.push("/dashboard");
                    } else if (res.error || res.message) {
                      setError(res.error || res.message);
                    }
                  } catch (e) {
                    setError("ลบอุปกรณ์ไม่สำเร็จ");
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ลบอุปกรณ์
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push(`/device/${id}`)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                disabled={saving}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </main>
        </div>
      </SidebarLayout>
    );
}
