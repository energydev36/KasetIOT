"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deviceAPI, templateAPI } from "@/lib/api";
import SidebarLayout from "@/components/SidebarLayout";

interface Device {
  _id: string;
  name: string;
  serialNumber: string;
  status: "online" | "offline";
  templateId: { name: string };
}

interface Template {
  _id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [newDevice, setNewDevice] = useState({
    serialNumber: "",
    templateId: "",
  });
  const [modalMessage, setModalMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    document.title = "แดชบอร์ด - KasetIOT";
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Get user role from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }

    const fetchData = async () => {
      try {
        const [devicesRes, templatesRes] = await Promise.all([
          deviceAPI.getDevices(token),
          templateAPI.getAllTemplates(),
        ]);

        if (devicesRes.devices) {
          setDevices(devicesRes.devices);
        }
        if (templatesRes.templates) {
          setTemplates(templatesRes.templates);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const prefetchDeviceData = async (deviceId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch full device details
      const deviceDetail = await deviceAPI.getDeviceDetail(token, deviceId);
      
      // Fetch sensor data
      const sensorUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/mqtt/${deviceId}/sensors`;
      const sensorResponse = await fetch(sensorUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let sensorData = null;
      if (sensorResponse.ok) {
        sensorData = await sensorResponse.json();
      }

      // Store prefetched data with timestamp
      const prefetchData = {
        device: deviceDetail.device,
        sensorData,
        timestamp: Date.now(),
      };

      // Store in both sessionStorage (for navigation) and localStorage (for direct access/back navigation)
      try {
        sessionStorage.setItem(`devicePrefetch:${deviceId}`, JSON.stringify(prefetchData));
        localStorage.setItem(`deviceCache:${deviceId}`, JSON.stringify(prefetchData));
      } catch (e) {
        console.warn("Failed to cache device data:", e);
      }
    } catch (error) {
      console.error("Error prefetching device data:", error);
    }
  };

  const handleAddDevice = async () => {
    setModalMessage(null);
    
    if (!newDevice.serialNumber || !newDevice.templateId) {
      setModalMessage({ type: "error", text: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }

    try {
      const token = localStorage.getItem("token")!;
      const response = await deviceAPI.addDevice(token, newDevice);

      if (response.device) {
        setDevices([...devices, response.device]);
        
        // Show success message
        if (response.message === 'Device restored successfully') {
          setModalMessage({ type: "success", text: "เพิ่มอุปกรณ์สำเร็จ (กู้คืนจากรายการที่ลบ)" });
        } else {
          setModalMessage({ type: "success", text: "เพิ่มอุปกรณ์สำเร็จ" });
        }
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setShowAddModal(false);
          setNewDevice({ serialNumber: "", templateId: "" });
          setModalMessage(null);
        }, 1500);
      } else if (response.error) {
        setModalMessage({ type: "error", text: response.error });
      }
    } catch (error: any) {
      console.error("Error adding device:", error);
      
      // Display error message from backend if available
      if (error.response && error.response.data && error.response.data.error) {
        setModalMessage({ type: "error", text: error.response.data.error });
      } else {
        setModalMessage({ type: "error", text: "ไม่สามารถเพิ่มอุปกรณ์ได้" });
      }
    }
  };

  return (
    <SidebarLayout userRole={userRole}>
      <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            อุปกรณ์ของฉัน
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + เพิ่มอุปกรณ์
          </button>
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div
              key={device._id}
              onClick={async () => {
                // Prefetch full device data in background
                prefetchDeviceData(device._id);
                
                // Navigate immediately
                router.push(`/device/${device._id}`);
              }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {device.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    device.status === "online"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {device.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                S/N: {device.serialNumber}
              </p>
              <p className="text-sm text-gray-500">{device.templateId?.name}</p>
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {loading ? "กำลังโหลด..." : "ยังไม่มีอุปกรณ์"}
            </p>
            {!loading && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-green-600 hover:text-green-700"
              >
                เพิ่มอุปกรณ์แรก
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">เพิ่มอุปกรณ์ใหม่</h3>
            
            {/* Message Display */}
            {modalMessage && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  modalMessage.type === "success"
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700"
                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700"
                }`}
              >
                {modalMessage.text}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เลือกประเภทอุปกรณ์
                </label>
                <select
                  value={newDevice.templateId}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, templateId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">เลือกประเภท</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  หมายเลขอุปกรณ์ (Serial Number)
                </label>
                <input
                  type="text"
                  value={newDevice.serialNumber}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, serialNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="KS001"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddDevice}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  );
}
