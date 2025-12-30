"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import * as api from "@/lib/api";

interface Device {
  _id: string;
  serialNumber: string;
  name: string;
  templateId: string | { name: string };
  ownerId: string | { name: string; email: string };
  status: "online" | "offline";
}

export default function AdminDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    document.title = "จัดการอุปกรณ์ - KasetIOT";
    
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr || "{}");
      if (user.role === "admin" || user.role === "supervisor") {
        setIsAuthorized(true);
        loadDevices();
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      router.push("/login");
    }
  }, [router]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token") || "";
      const response = await api.adminAPI.getAllDevices(token);
      setDevices(response.devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const getOwnerEmail = (owner: any): string => {
    if (typeof owner === "string") return "Unknown";
    if (owner?.email) return owner.email;
    return "Unknown";
  };

  const getTemplateName = (template: any): string => {
    if (typeof template === "string") return "Unknown";
    if (template?.name) return template.name;
    return "Unknown";
  };

  const handleDeleteClick = (device: Device) => {
    setDeviceToDelete(device);
    setShowDeleteModal(true);
    setDeletePassword("");
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete) return;
    
    try {
      setDeleteError("");
      const token = localStorage.getItem("token") || "";
      
      // Verify admin password by attempting to login
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user?.email) {
        setDeleteError("ไม่พบข้อมูลผู้ใช้");
        return;
      }

      // Verify password
      const verifyResponse = await api.authAPI.login({
        email: user.email,
        password: deletePassword,
      });

      if (verifyResponse.error) {
        setDeleteError("รหัสผ่านไม่ถูกต้อง");
        return;
      }

      // Delete device
      const deleteResponse = await api.deviceAPI.deleteDevice(token, deviceToDelete._id);
      
      if (deleteResponse.error) {
        setDeleteError(deleteResponse.error);
        return;
      }

      // Success - reload devices
      setShowDeleteModal(false);
      setDeviceToDelete(null);
      setDeletePassword("");
      await loadDevices();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "ลบอุปกรณ์ไม่สำเร็จ");
    }
  };

  if (loading && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const userStr = localStorage.getItem("user");
  const userRole = userStr ? JSON.parse(userStr).role : undefined;

  return (
    <SidebarLayout userRole={userRole}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Devices</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View all devices across the system</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading devices...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Device Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Serial Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No devices found
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <tr key={device._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {device.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {device.serialNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getTemplateName(device.templateId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getOwnerEmail(device.ownerId)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            device.status === "online"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {device.status === "online" ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDeleteClick(device)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deviceToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                ⚠️ ยืนยันการลบอุปกรณ์
              </h2>
              
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                  <strong>คำเตือน:</strong> การลบจะไม่สามารถย้อนกลับได้!
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  คุณกำลังจะลบอุปกรณ์:
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {deviceToDelete.name} ({deviceToDelete.serialNumber})
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  กรุณายืนยันด้วยรหัสผ่านของคุณ:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="รหัสผ่าน Admin"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && deletePassword) {
                      handleDeleteConfirm();
                    }
                  }}
                />
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-200 text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeviceToDelete(null);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={!deletePassword}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ลบอุปกรณ์
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
