"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "supervisor";
  suspended: boolean;
}

interface Device {
  _id: string;
  serialNumber: string;
  name: string;
  templateId: string;
  ownerId: string;
  ownerEmail?: string;
  status: "online" | "offline";
}

interface Template {
  _id: string;
  name: string;
  description: string;
  outputs: any[];
  digitalSensors: any[];
  analogSensors: any[];
  rs485Sensors: any[];
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "members" | "devices" | "templates"
  >("members");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "แอดมิน - KasetIOT";
  }, []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr || "{}");
      // Only admin or supervisor can access admin page
      if (user.role === "admin" || user.role === "supervisor") {
        setIsAuthorized(true);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-800"
              >
                ← กลับ
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                Admin Panel
              </h1>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("members")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "members"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              จัดการสมาชิก
            </button>
            <button
              onClick={() => setActiveTab("devices")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "devices"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              จัดการอุปกรณ์
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "templates"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              เทมเพลตอุปกรณ์
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "members" && <MembersTab />}
        {activeTab === "devices" && <DevicesTab />}
        {activeTab === "templates" && <TemplatesTab />}
      </main>
    </div>
  );
}

function MembersTab() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token") || "";
      const response = await api.adminAPI.getAllUsers(token);
      setMembers(response.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, currentSuspended: boolean) => {
    if (!confirm(currentSuspended ? "คืนการใช้งานผู้ใช้นี้?" : "ระงับผู้ใช้นี้?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      if (currentSuspended) {
        await api.adminAPI.unsuspendUser(token, userId);
      } else {
        await api.adminAPI.suspendUser(token, userId);
      }
      await loadMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("ต้องการลบผู้ใช้นี้ใช่หรือไม่?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      await api.adminAPI.deleteUser(token, userId);
      await loadMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">รายการสมาชิก</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">กำลังโหลด...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ชื่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  อีเมล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    ไม่มีสมาชิก
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {member.role === "admin"
                          ? "ผู้ดูแล"
                          : member.role === "supervisor"
                          ? "ผู้ดูแลสวน"
                          : "ผู้ใช้"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          member.suspended
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {member.suspended ? "ระงับ" : "ใช้งาน"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() =>
                          handleSuspendUser(member._id, member.suspended)
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {member.suspended ? "คืน" : "ระงับ"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(member._id)}
                        className="text-red-600 hover:text-red-800"
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
    </div>
  );
}

function DevicesTab() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token") || "";
      const response = await api.adminAPI.getAllDevices(token);
      setDevices(response.devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("ต้องการลบอุปกรณ์นี้ใช่หรือไม่?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      await api.deviceAPI.deleteDevice(token, deviceId);
      await loadDevices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete device");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">อุปกรณ์ทั้งหมด</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">กำลังโหลด...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ชื่ออุปกรณ์
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  เจ้าของ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    ไม่มีอุปกรณ์
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {device.serialNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{device.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {device.ownerEmail || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          device.status === "online"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {device.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => router.push(`/device/${device._id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ดูรายละเอียด
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device._id)}
                        className="text-red-600 hover:text-red-800"
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
    </div>
  );
}

function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    outputs: [{ id: "output_1", name: "output1", type: "digital" }],
    digitalSensors: [{ id: "digital_1", name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: false }],
    analogSensors: [{ id: "analog_1", name: "", unit: "", minValue: 0, maxValue: 100 }],
    rs485Sensors: [{ id: "rs485_1", name: "", baudRate: 9600, dataFormat: "" }],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.templateAPI.getAllTemplates();
      setTemplates(Array.isArray(response) ? response : response.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token") || "";
      const dataToSend = {
        name: formData.name,
        description: formData.description,
        outputs: formData.outputs.filter((o: any) => o.name.trim()),
        digitalSensors: formData.digitalSensors.filter((s: any) => s.name.trim()),
        analogSensors: formData.analogSensors.filter((s: any) => s.name.trim()),
        rs485Sensors: formData.rs485Sensors.filter((s: any) => s.name.trim()),
      };

      if (editingTemplate) {
        await api.templateAPI.updateTemplate(token, editingTemplate._id, dataToSend);
      } else {
        await api.templateAPI.createTemplate(token, dataToSend);
      }
      setSuccessMessage(editingTemplate ? "อัปเดตเทมเพลตเรียบร้อย ✓" : "สร้างเทมเพลตเรียบร้อย ✓");
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadTemplates();
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save template");
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      outputs: template.outputs?.length ? template.outputs : [{ id: "output_1", name: "output1", type: "digital" }],
      digitalSensors: template.digitalSensors?.length ? template.digitalSensors : [{ id: "digital_1", name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: false }],
      analogSensors: template.analogSensors?.length ? template.analogSensors : [{ id: "analog_1", name: "", unit: "", minValue: 0, maxValue: 100 }],
      rs485Sensors: template.rs485Sensors?.length ? template.rs485Sensors : [{ id: "rs485_1", name: "", baudRate: 9600, dataFormat: "" }],
    });
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("ต้องการลบเทมเพลตนี้ใช่หรือไม่?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      await api.templateAPI.deleteTemplate(token, templateId);
      await loadTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const resetForm = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      outputs: [{ id: "output_1", name: "output1", type: "digital" }],
      digitalSensors: [{ id: "digital_1", name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: false }],
      analogSensors: [{ id: "analog_1", name: "", unit: "", minValue: 0, maxValue: 100 }],
      rs485Sensors: [{ id: "rs485_1", name: "", baudRate: 9600, dataFormat: "" }],
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">เทมเพลตอุปกรณ์</h2>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({
              name: "",
              description: "",
              outputs: [{ id: "output_1", name: "output1", type: "digital" }],
              digitalSensors: [{ id: "digital_1", name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: false }],
              analogSensors: [{ id: "analog_1", name: "", unit: "", minValue: 0, maxValue: 100 }],
              rs485Sensors: [{ id: "rs485_1", name: "", baudRate: 9600, dataFormat: "" }],
            });
            setShowCreateModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + สร้างเทมเพลต
        </button>
      </div>

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

      {loading ? (
        <div className="text-center py-8 text-gray-600">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">
              ไม่มีเทมเพลต
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  )}
                </div>

                {/* Component Count */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Output:</span>
                      <span className="font-semibold text-gray-900">{template.outputs?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Digital Sensor:</span>
                      <span className="font-semibold text-gray-900">
                        {template.digitalSensors?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Analog Sensor:</span>
                      <span className="font-semibold text-gray-900">{template.analogSensors?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">RS485 Sensor:</span>
                      <span className="font-semibold text-gray-900">
                        {template.rs485Sensors?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MQTT Topic Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs">
                  <p className="font-semibold text-blue-900 mb-2">MQTT Topics Example:</p>
                  <div className="space-y-2 text-blue-800 font-mono text-xs leading-relaxed">
                    {template.outputs && template.outputs.length > 0 && (
                      <div>
                        <p className="text-blue-900 font-medium">Output ({template.outputs[0]?.name || template.outputs[0]?.id}):</p>
                        <p className="pl-2 text-blue-700 break-words">kaset/{template.name}/{'{serial}'}/{template.outputs[0]?.id}/{'{set|state}'}</p>
                      </div>
                    )}
                    {(template.digitalSensors?.length > 0 || template.analogSensors?.length > 0 || template.rs485Sensors?.length > 0) && (
                      <div>
                        <p className="text-blue-900 font-medium">Sensors:</p>
                        {template.digitalSensors && template.digitalSensors.length > 0 && (
                          <p className="pl-2 text-blue-700 break-words">kaset/{template.name}/{'{serial}'}/{template.digitalSensors[0]?.id}/state</p>
                        )}
                        {template.analogSensors && template.analogSensors.length > 0 && (
                          <p className="pl-2 text-blue-700 break-words">kaset/{template.name}/{'{serial}'}/{template.analogSensors[0]?.id}/state</p>
                        )}
                        {template.rs485Sensors && template.rs485Sensors.length > 0 && (
                          <p className="pl-2 text-blue-700 break-words">kaset/{template.name}/{'{serial}'}/{template.rs485Sensors[0]?.id}/state</p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-blue-900 font-medium">Availability:</p>
                      <p className="pl-2 text-blue-700 break-words">kaset/{template.name}/{'{serial}'}/availability</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <TemplateModal
          isEditing={!!editingTemplate}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}
    </div>
  );
}

interface TemplateModalProps {
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

function TemplateModal({ isEditing, formData, setFormData, onSubmit, onCancel }: TemplateModalProps) {
  const [activeSection, setActiveSection] = useState<"basic" | "outputs" | "digital" | "analog" | "rs485">("basic");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 my-8">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "แก้ไขเทมเพลต" : "สร้างเทมเพลตใหม่"}
        </h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["basic", "outputs", "digital", "analog", "rs485"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section as any)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeSection === section
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {section === "basic" && "พื้นฐาน"}
              {section === "outputs" && "Output"}
              {section === "digital" && "Digital"}
              {section === "analog" && "Analog"}
              {section === "rs485" && "RS485"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-h-96 overflow-y-auto pb-4">
          {/* Basic Information */}
          {activeSection === "basic" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อเทมเพลต *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="เช่น Water Pump Control"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="คำอธิบายเทมเพลตนี้"
                />
              </div>
            </>
          )}

          {/* Outputs */}
          {activeSection === "outputs" && (
            <div className="space-y-4">
              {formData.outputs.map((output: any, idx: number) => (
                <div key={output.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">Output #{idx + 1}</span>
                    {formData.outputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            outputs: formData.outputs.filter((_: any, i: number) => i !== idx),
                          })
                        }
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="ชื่อ Output"
                    value={output.name}
                    onChange={(e) => {
                      const newOutputs = [...formData.outputs];
                      newOutputs[idx].name = e.target.value;
                      setFormData({ ...formData, outputs: newOutputs });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={output.type}
                    onChange={(e) => {
                      const newOutputs = [...formData.outputs];
                      newOutputs[idx].type = e.target.value;
                      setFormData({ ...formData, outputs: newOutputs });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="digital">Digital</option>
                    <option value="relay">Relay</option>
                  </select>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  // Determine next sequential index from existing output IDs
                  const existing = formData.outputs || [];
                  const extractNum = (id: string) => {
                    const m = id.match(/^output_?(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                  };
                  const maxIdx = existing.reduce((max: number, o: any) => Math.max(max, extractNum(o.id || '')), 0);
                  const nextIdx = maxIdx + 1;
                  const newOutput = { id: `output_${nextIdx}`, name: `output${nextIdx}`, type: "digital" };

                  setFormData({
                    ...formData,
                    outputs: [...existing, newOutput],
                  });
                }}
                className="w-full px-3 py-2 border border-green-300 text-green-600 rounded hover:bg-green-50"
              >
                + เพิ่ม Output
              </button>
            </div>
          )}

          {/* Digital Sensors */}
          {activeSection === "digital" && (
            <div className="space-y-4">
              {formData.digitalSensors.map((sensor: any, idx: number) => (
                <div key={sensor.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">Digital #{idx + 1}</span>
                    {formData.digitalSensors.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            digitalSensors: formData.digitalSensors.filter((_: any, i: number) => i !== idx),
                          })
                        }
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="ชื่อเซนเซอร์"
                    value={sensor.name}
                    onChange={(e) => {
                      const newSensors = [...formData.digitalSensors];
                      newSensors[idx].name = e.target.value;
                      setFormData({ ...formData, digitalSensors: newSensors });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label ON"
                      value={sensor.onLabel}
                      onChange={(e) => {
                        const newSensors = [...formData.digitalSensors];
                        newSensors[idx].onLabel = e.target.value;
                        setFormData({ ...formData, digitalSensors: newSensors });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Label OFF"
                      value={sensor.offLabel}
                      onChange={(e) => {
                        const newSensors = [...formData.digitalSensors];
                        newSensors[idx].offLabel = e.target.value;
                        setFormData({ ...formData, digitalSensors: newSensors });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="สี ON (เช่น #00FF00)"
                    value={sensor.onColor}
                    onChange={(e) => {
                      const newSensors = [...formData.digitalSensors];
                      newSensors[idx].onColor = e.target.value;
                      setFormData({ ...formData, digitalSensors: newSensors });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sensor.activeLow}
                      onChange={(e) => {
                        const newSensors = [...formData.digitalSensors];
                        newSensors[idx].activeLow = e.target.checked;
                        setFormData({ ...formData, digitalSensors: newSensors });
                      }}
                      className="rounded"
                    />
                    Active Low
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    digitalSensors: [
                      ...formData.digitalSensors,
                      { id: `digital_${Date.now()}`, name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: false },
                    ],
                  })
                }
                className="w-full px-3 py-2 border border-green-300 text-green-600 rounded hover:bg-green-50"
              >
                + เพิ่ม Digital Sensor
              </button>
            </div>
          )}

          {/* Analog Sensors */}
          {activeSection === "analog" && (
            <div className="space-y-4">
              {formData.analogSensors.map((sensor: any, idx: number) => (
                <div key={sensor.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">Analog #{idx + 1}</span>
                    {formData.analogSensors.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            analogSensors: formData.analogSensors.filter((_: any, i: number) => i !== idx),
                          })
                        }
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="ชื่อเซนเซอร์"
                    value={sensor.name}
                    onChange={(e) => {
                      const newSensors = [...formData.analogSensors];
                      newSensors[idx].name = e.target.value;
                      setFormData({ ...formData, analogSensors: newSensors });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="หน่วย (เช่น °C, %)"
                    value={sensor.unit}
                    onChange={(e) => {
                      const newSensors = [...formData.analogSensors];
                      newSensors[idx].unit = e.target.value;
                      setFormData({ ...formData, analogSensors: newSensors });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="ค่า Min"
                      value={sensor.minValue}
                      onChange={(e) => {
                        const newSensors = [...formData.analogSensors];
                        newSensors[idx].minValue = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, analogSensors: newSensors });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="ค่า Max"
                      value={sensor.maxValue}
                      onChange={(e) => {
                        const newSensors = [...formData.analogSensors];
                        newSensors[idx].maxValue = parseFloat(e.target.value) || 100;
                        setFormData({ ...formData, analogSensors: newSensors });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    analogSensors: [
                      ...formData.analogSensors,
                      { id: `analog_${Date.now()}`, name: "", unit: "", minValue: 0, maxValue: 100 },
                    ],
                  })
                }
                className="w-full px-3 py-2 border border-green-300 text-green-600 rounded hover:bg-green-50"
              >
                + เพิ่ม Analog Sensor
              </button>
            </div>
          )}

          {/* RS485 Sensors */}
          {activeSection === "rs485" && (
            <div className="space-y-4">
              {formData.rs485Sensors.map((sensor: any, idx: number) => (
                <div key={sensor.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">RS485 #{idx + 1}</span>
                    {formData.rs485Sensors.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            rs485Sensors: formData.rs485Sensors.filter((_: any, i: number) => i !== idx),
                          })
                        }
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="ชื่อเซนเซอร์"
                    value={sensor.name}
                    onChange={(e) => {
                      const newSensors = [...formData.rs485Sensors];
                      newSensors[idx].name = e.target.value;
                      setFormData({ ...formData, rs485Sensors: newSensors });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={sensor.baudRate}
                    onChange={(e) => {
                      const newSensors = [...formData.rs485Sensors];
                      newSensors[idx].baudRate = parseInt(e.target.value);
                      setFormData({ ...formData, rs485Sensors: newSensors });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="9600">9600</option>
                    <option value="19200">19200</option>
                    <option value="38400">38400</option>
                    <option value="57600">57600</option>
                    <option value="115200">115200</option>
                  </select>
                  <input
                    type="text"
                    placeholder="รูปแบบข้อมูล"
                    value={sensor.dataFormat}
                    onChange={(e) => {
                      const newSensors = [...formData.rs485Sensors];
                      newSensors[idx].dataFormat = e.target.value;
                      setFormData({ ...formData, rs485Sensors: newSensors });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    rs485Sensors: [
                      ...formData.rs485Sensors,
                      { id: `rs485_${Date.now()}`, name: "", baudRate: 9600, dataFormat: "" },
                    ],
                  })
                }
                className="w-full px-3 py-2 border border-green-300 text-green-600 rounded hover:bg-green-50"
              >
                + เพิ่ม RS485 Sensor
              </button>
            </div>
          )}
        </form>

        <div className="flex gap-3 mt-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {isEditing ? "อัปเดต" : "สร้าง"}
          </button>
        </div>
      </div>
    </div>
  );
}
