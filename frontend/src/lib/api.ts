const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getProfile: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};

// Device API
export const deviceAPI = {
  getDevices: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  addDevice: async (token: string, data: { serialNumber: string; templateId: string }) => {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getDeviceDetail: async (token: string, deviceId: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  updateDeviceName: async (token: string, deviceId: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  updateDeviceSettings: async (token: string, deviceId: string, settings: any) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    });
    return response.json();
  },

  deleteDevice: async (token: string, deviceId: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  hideDeviceForUser: async (token: string, deviceId: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/hide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getHiddenDevices: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/hidden`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  unhideDevice: async (token: string, deviceId: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/unhide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};

// Schedule API
export const scheduleAPI = {
  getSchedules: async (token: string, deviceId: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/schedules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  addSchedule: async (
    token: string,
    deviceId: string,
    data: {
      zone: string;
      round: number;
      startTime: string;
      duration: number;
      days: string[];
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateSchedule: async (
    token: string,
    deviceId: string,
    scheduleId: string,
    data: {
      zone?: string;
      round?: number;
      startTime?: string;
      duration?: number;
      days?: string[];
      enabled?: boolean;
    }
  ) => {
    const url = `${API_BASE_URL}/devices/${deviceId}/schedules/${scheduleId}`;
    console.log('[API] updateSchedule URL:', url);
    console.log('[API] updateSchedule data:', data);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    console.log('[API] updateSchedule response status:', response.status);
    const result = await response.json();
    console.log('[API] updateSchedule response body:', result);
    return result;
  },

  deleteSchedule: async (token: string, deviceId: string, scheduleId: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};

// Template API
export const templateAPI = {
  getAllTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/templates`);
    return response.json();
  },

  getTemplateDetail: async (templateId: string) => {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`);
    return response.json();
  },

  createTemplate: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateTemplate: async (token: string, templateId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteTemplate: async (token: string, templateId: string) => {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};

// Admin API
export const adminAPI = {
  getAllUsers: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getAllDevices: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  suspendUser: async (token: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/suspend`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  unsuspendUser: async (token: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unsuspend`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  deleteUser: async (token: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};
