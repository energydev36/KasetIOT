"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import * as api from "@/lib/api";

interface DeviceTemplate {
  _id: string;
  name: string;
  outputs: any[];
}

interface Device {
  _id: string;
  serialNumber: string;
  name: string;
  status: "online" | "offline";
  templateId: DeviceTemplate;
  settings?: any;
}

interface Schedule {
  _id: string;
  zone: string;
  round: number;
  startTime: string;
  duration: number;
  days: string[];
  enabled: boolean;
}

const DAY_OPTIONS = [
  { key: "Mon", label: "จ." },
  { key: "Tue", label: "อ." },
  { key: "Wed", label: "พ." },
  { key: "Thu", label: "พฤ." },
  { key: "Fri", label: "ศ." },
  { key: "Sat", label: "ส." },
  { key: "Sun", label: "อา." },
];

export default function DeviceSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [device, setDevice] = useState<Device | null>(null);
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [zone, setZone] = useState("");
  const [round, setRound] = useState(1);
  const [startTime, setStartTime] = useState("06:00");
  const [duration, setDuration] = useState(10);
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    document.title = "ตารางเวลา - KasetIOT";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token") || "";

        const detail = await api.deviceAPI.getDeviceDetail(token, id);
        const dev = detail.device as Device;
        setDevice(dev);

        const template = dev.templateId as DeviceTemplate;
        const zonesFromSettings =
          dev.settings?.zones && dev.settings.zones.length > 0
            ? dev.settings.zones
            : template.outputs?.map((o: any) => ({ id: o.id, name: o.name })) || [];
        setZones(zonesFromSettings);

        const scheduleRes = await api.scheduleAPI.getSchedules(token, id);
        setSchedules(scheduleRes.schedules || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลดตารางเวลาไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const refreshSchedules = async () => {
    const token = localStorage.getItem("token") || "";
    const scheduleRes = await api.scheduleAPI.getSchedules(token, id);
    setSchedules(scheduleRes.schedules || []);
  };

  const resetForm = () => {
    setZone("");
    setRound(1);
    setStartTime("06:00");
    setDuration(10);
    setDays([]);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setZone(schedule.zone);
    setRound(schedule.round);
    setStartTime(schedule.startTime);
    setDuration(schedule.duration);
    setDays(schedule.days || []);
    setEditingId(schedule._id);
    setShowModal(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) {
      setError("กรุณาเลือกโซน");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("token") || "";
      const normalizedRound = Number(round) || 1;
      const normalizedDuration = Number(duration) || 0;

      console.log("[Schedule] Saving schedule...");
      console.log("[Schedule] editingId:", editingId);
      console.log("[Schedule] zone:", zone);
      console.log("[Schedule] round:", normalizedRound);
      console.log("[Schedule] startTime:", startTime);
      console.log("[Schedule] duration:", normalizedDuration);
      console.log("[Schedule] days:", days);

      if (editingId) {
        // Editing existing schedule by ID (zone and round cannot be changed)
        console.log("[Schedule] Updating schedule ID:", editingId);
        const updateData = {
          startTime,
          duration: normalizedDuration,
          days,
        };
        console.log("[Schedule] Update data:", updateData);
        const response = await api.scheduleAPI.updateSchedule(token, id, editingId, updateData);
        console.log("[Schedule] Update response:", response);
        setSuccessMessage("อัปเดตตารางเวลาแล้ว ✓");
      } else {
        // Adding new schedule (backend will upsert if zone+round exists)
        console.log("[Schedule] Adding new schedule");
        const addData = {
          zone,
          round: normalizedRound,
          startTime,
          duration: normalizedDuration,
          days,
        };
        console.log("[Schedule] Add data:", addData);
        const response = await api.scheduleAPI.addSchedule(token, id, addData);
        console.log("[Schedule] Add response:", response);
        setSuccessMessage("เพิ่มตารางเวลาแล้ว ✓");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      resetForm();
      setShowModal(false);
      await refreshSchedules();
    } catch (err) {
      console.error("[Schedule] Error saving:", err);
      setError(err instanceof Error ? err.message : "บันทึกตารางเวลาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem("token") || "";
      await api.scheduleAPI.updateSchedule(token, id, scheduleId, { enabled: !enabled });
      await refreshSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปเดตตารางไม่สำเร็จ");
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("ลบตารางเวลานี้?")) return;
    try {
      const token = localStorage.getItem("token") || "";
      await api.scheduleAPI.deleteSchedule(token, id, scheduleId);
      await refreshSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบตารางไม่สำเร็จ");
    }
  };

  const getZoneName = (zoneId: string) =>
    zones.find((z) => z.id === zoneId)?.name || zoneId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">กำลังโหลดตารางเวลา...</p>
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
              onClick={() => router.push(`/device/${id}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← กลับ
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">ตั้งเวลาการทำงาน</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {/* Device Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{device.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Serial: {device.serialNumber}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                device.status === "online" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {device.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
            </span>
          </div>
        </div>

        {/* Create Schedule CTA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">จัดการตารางเวลา</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">เพิ่มหรือแก้ไขตารางเวลาแต่ละโซนและรอบ</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + เพิ่มตารางเวลา
          </button>
        </div>

        {/* Schedule List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ตารางเวลาทั้งหมด</h2>
          {schedules.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">ยังไม่มีตารางเวลา</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 dark:bg-gray-700"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {getZoneName(schedule.zone)} | รอบ {schedule.round}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      เวลา {schedule.startTime} นาน {schedule.duration} นาที
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      วัน: {schedule.days.map(d => DAY_OPTIONS.find(opt => opt.key === d)?.label || d).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSchedule(schedule._id, schedule.enabled)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        schedule.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {schedule.enabled ? "เปิด" : "ปิด"}
                    </button>
                    <button
                      onClick={() => openEditModal(schedule)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingId ? "แก้ไขตารางเวลา" : "เพิ่มตารางเวลา"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โซน</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={!!editingId}
                >
                  <option value="">เลือกโซน</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รอบ</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={round}
                  onChange={(e) => setRound(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา (นาที)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">วัน</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((d) => {
                    const selected = days.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() =>
                          setDays(
                            selected ? days.filter((x) => x !== d.key) : [...days, d.key]
                          )
                        }
                        className={`px-3 py-1 rounded-full border text-sm ${
                          selected
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มตาราง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  );
}
