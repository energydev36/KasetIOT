"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import * as api from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "supervisor";
  suspended: boolean;
}

export default function AdminMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "จัดการสมาชิก - KasetIOT";
    
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
        loadMembers();
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      router.push("/login");
    }
  }, [router]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token") || "";
      const response = await api.adminAPI.getAllUsers(token);
      setMembers(response.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, currentSuspended: boolean) => {
    if (!confirm(currentSuspended ? "Unsuspend this user?" : "Suspend this user?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      if (currentSuspended) {
        await api.adminAPI.unsuspendUser(token, userId);
      } else {
        await api.adminAPI.suspendUser(token, userId);
      }
      await loadMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user and all their devices?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      await api.adminAPI.deleteUser(token, userId);
      await loadMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View and manage all users</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading members...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Role
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
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No members found
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            member.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : member.role === "supervisor"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            member.suspended
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {member.suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() =>
                            handleSuspendUser(member._id, member.suspended)
                          }
                          className={`px-3 py-1 rounded text-sm ${
                            member.suspended
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          }`}
                        >
                          {member.suspended ? "Unsuspend" : "Suspend"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member._id)}
                          className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Delete
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
    </SidebarLayout>
  );
}
