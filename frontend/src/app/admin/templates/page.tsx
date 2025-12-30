"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import IconSelector from "@/components/IconSelector";
import * as api from "@/lib/api";

interface Template {
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

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    topics: { outputsBase: "", digitalSensorsBase: "", analogSensorsBase: "", rs485SensorsBase: "" },
    outputs: [{ id: "output_1", name: "output1", type: "digital" }],
    digitalSensors: [{ id: "digital_1", name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: true }],
    analogSensors: [{ id: "analog_1", name: "", unit: "", minValue: 0, maxValue: 100, icon: "" }],
    rs485Sensors: [{ id: "rs485_1", name: "", address: 1, unit: "", icon: "" }],
  });

  useEffect(() => {
    document.title = "จัดการเทมเพลต - KasetIOT";
    
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
        loadTemplates();
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      router.push("/login");
    }
  }, [router]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.templateAPI.getAllTemplates();
      setTemplates(response.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      ...template,
      topics: {
        outputsBase: template.topics?.outputsBase || "",
        digitalSensorsBase: template.topics?.digitalSensorsBase || "",
        analogSensorsBase: template.topics?.analogSensorsBase || "",
        rs485SensorsBase: template.topics?.rs485SensorsBase || "",
      },
    });
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      await api.templateAPI.deleteTemplate(token, id);
      await loadTemplates();
      setSuccessMessage("Template deleted successfully ✓");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      if (editingTemplate) {
        await api.templateAPI.updateTemplate(token, editingTemplate._id, formData);
      } else {
        await api.templateAPI.createTemplate(token, formData);
      }
      await loadTemplates();
      resetForm();
      setSuccessMessage(editingTemplate ? "Template updated ✓" : "Template created ✓");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setShowCreateModal(false);
    setFormData({
      name: "",
      description: "",
      topics: { outputsBase: "", digitalSensorsBase: "", analogSensorsBase: "", rs485SensorsBase: "" },
      outputs: [{ id: "output_1", name: "output1", type: "digital" }],
      digitalSensors: [{ id: "digital_1", name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: true }],
      analogSensors: [{ id: "analog_1", name: "", unit: "", minValue: 0, maxValue: 100, icon: "" }],
      rs485Sensors: [{ id: "rs485_1", name: "", address: 1, unit: "", icon: "" }],
    });
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Device Templates</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage device configuration templates</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowCreateModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Create Template
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
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                No templates found
              </div>
            ) : (
              templates.map((template) => (
                <div key={template._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Output:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{template.outputs?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Digital:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{template.digitalSensors?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Analog:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{template.analogSensors?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">RS485:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{template.rs485Sensors?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id)}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingTemplate ? "Edit Template" : "Create Template"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., T8i-Timer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>

                {/* Outputs */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Outputs ({formData.outputs.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `output_${formData.outputs.length + 1}`;
                        setFormData({
                          ...formData,
                          outputs: [...formData.outputs, { id: newId, name: `output${formData.outputs.length + 1}`, type: "digital" }],
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Output
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Topic Base</label>
                    <input
                      type="text"
                      value={formData.topics?.outputsBase || ""}
                      onChange={(e) => setFormData({ ...formData, topics: { ...formData.topics, outputsBase: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., zone"
                    />
                  </div>
                  <div className="space-y-2">
                    {formData.outputs.map((output, idx) => (
                      <div key={idx} className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded">
                        <div className="flex gap-2">
                        <input
                          type="text"
                          value={output.name}
                          onChange={(e) => {
                            const newOutputs = [...formData.outputs];
                            newOutputs[idx].name = e.target.value;
                            setFormData({ ...formData, outputs: newOutputs });
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Output name"
                        />
                        {formData.outputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                outputs: formData.outputs.filter((_, i) => i !== idx),
                              });
                            }}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Sensors */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Digital Sensors ({formData.digitalSensors.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `digital_${formData.digitalSensors.length + 1}`;
                        setFormData({
                          ...formData,
                          digitalSensors: [
                            ...formData.digitalSensors,
                            { id: newId, name: "", onLabel: "ON", offLabel: "OFF", icon: "", onColor: "", activeLow: false },
                          ],
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Sensor
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Topic Base</label>
                    <input
                      type="text"
                      value={formData.topics?.digitalSensorsBase || ""}
                      onChange={(e) => setFormData({ ...formData, topics: { ...formData.topics, digitalSensorsBase: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., sensor"
                    />
                  </div>
                  <div className="space-y-3">
                    {formData.digitalSensors.map((sensor, idx) => (
                      <div key={idx} className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded">
                        {/* Row 1: ชื่อเซนเซอร์ | Icon */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={sensor.name}
                            onChange={(e) => {
                              const newSensors = [...formData.digitalSensors];
                              newSensors[idx].name = e.target.value;
                              setFormData({ ...formData, digitalSensors: newSensors });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="ชื่อเซนเซอร์"
                          />
                          <IconSelector
                            value={sensor.icon || ""}
                            onChange={(value) => {
                              const newSensors = [...formData.digitalSensors];
                              newSensors[idx].icon = value;
                              setFormData({ ...formData, digitalSensors: newSensors });
                            }}
                          />
                        </div>
                        
                        {/* Row 2: ชื่อตอน ON | ชื่อตอน OFF */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={sensor.onLabel}
                            onChange={(e) => {
                              const newSensors = [...formData.digitalSensors];
                              newSensors[idx].onLabel = e.target.value;
                              setFormData({ ...formData, digitalSensors: newSensors });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="ชื่อตอน ON"
                          />
                          <input
                            type="text"
                            value={sensor.offLabel}
                            onChange={(e) => {
                              const newSensors = [...formData.digitalSensors];
                              newSensors[idx].offLabel = e.target.value;
                              setFormData({ ...formData, digitalSensors: newSensors });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="ชื่อตอน OFF"
                          />
                        </div>
                        
                        {/* Row 3: สีตอน ON | โหมดทำงาน */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">สีตอน ON</label>
                            <input
                              type="color"
                              value={sensor.onColor || "#10b981"}
                              onChange={(e) => {
                                const newSensors = [...formData.digitalSensors];
                                newSensors[idx].onColor = e.target.value;
                                setFormData({ ...formData, digitalSensors: newSensors });
                              }}
                              className="w-full h-9 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">โหมดทำงาน</label>
                            <select
                              value={sensor.activeLow ? 'low' : 'high'}
                              onChange={(e) => {
                                const newSensors = [...formData.digitalSensors];
                                newSensors[idx].activeLow = e.target.value === 'low';
                                setFormData({ ...formData, digitalSensors: newSensors });
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="high">Active High</option>
                              <option value="low">Active Low</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Remove button */}
                        {formData.digitalSensors.length > 1 && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  digitalSensors: formData.digitalSensors.filter((_, i) => i !== idx),
                                });
                              }}
                              className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              ลบเซนเซอร์นี้
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analog Sensors */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Analog Sensors ({formData.analogSensors.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `analog_${formData.analogSensors.length + 1}`;
                        setFormData({
                          ...formData,
                          analogSensors: [
                            ...formData.analogSensors,
                            { id: newId, name: "", unit: "", minValue: 0, maxValue: 100, icon: "" },
                          ],
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Sensor
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Topic Base</label>
                    <input
                      type="text"
                      value={formData.topics?.analogSensorsBase || ""}
                      onChange={(e) => setFormData({ ...formData, topics: { ...formData.topics, analogSensorsBase: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., analog"
                    />
                  </div>
                  <div className="space-y-2">
                    {formData.analogSensors.map((sensor, idx) => (
                      <div key={idx} className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={sensor.name}
                            onChange={(e) => {
                              const newSensors = [...formData.analogSensors];
                              newSensors[idx].name = e.target.value;
                              setFormData({ ...formData, analogSensors: newSensors });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Sensor name"
                          />
                          <IconSelector
                            value={sensor.icon || ""}
                            onChange={(value) => {
                              const newSensors = [...formData.analogSensors];
                              newSensors[idx].icon = value;
                              setFormData({ ...formData, analogSensors: newSensors });
                            }}
                          />
                        </div>
                        <div className="flex justify-end">
                          {formData.analogSensors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  analogSensors: formData.analogSensors.filter((_, i) => i !== idx),
                                });
                              }}
                              className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RS485 Sensors */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      RS485 Sensors ({formData.rs485Sensors.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `rs485_${formData.rs485Sensors.length + 1}`;
                        setFormData({
                          ...formData,
                          rs485Sensors: [
                            ...formData.rs485Sensors,
                            { id: newId, name: "", address: formData.rs485Sensors.length + 1, unit: "", icon: "" },
                          ],
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add RS485
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Topic Base</label>
                    <input
                      type="text"
                      value={formData.topics?.rs485SensorsBase || ""}
                      onChange={(e) => setFormData({ ...formData, topics: { ...formData.topics, rs485SensorsBase: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., rs485"
                    />
                  </div>
                  <div className="space-y-2">
                    {formData.rs485Sensors.map((sensor, idx) => (
                      <div key={idx} className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={sensor.name}
                            onChange={(e) => {
                              const newSensors = [...formData.rs485Sensors];
                              newSensors[idx].name = e.target.value;
                              setFormData({ ...formData, rs485Sensors: newSensors });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Name"
                          />
                          <IconSelector
                            value={sensor.icon || ""}
                            onChange={(value) => {
                              const newSensors = [...formData.rs485Sensors];
                              newSensors[idx].icon = value;
                              setFormData({ ...formData, rs485Sensors: newSensors });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={0}
                            value={sensor.address ?? ""}
                            onChange={(e) => {
                              const newSensors = [...formData.rs485Sensors];
                              newSensors[idx].address = Number(e.target.value);
                              setFormData({ ...formData, rs485Sensors: newSensors });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Address"
                          />
                          <input
                            type="text"
                            value={sensor.unit || ""}
                            onChange={(e) => {
                              const newSensors = [...formData.rs485Sensors];
                              newSensors[idx].unit = e.target.value;
                              setFormData({ ...formData, rs485Sensors: newSensors });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Unit (e.g., °C, %RH)"
                          />
                        </div>
                        {formData.rs485Sensors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                rs485Sensors: formData.rs485Sensors.filter((_, i) => i !== idx),
                              });
                            }}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingTemplate ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
