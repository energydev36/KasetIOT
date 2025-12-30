"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Home, 
  User, 
  Users, 
  Cpu, 
  FileText, 
  LogOut, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ userRole, isOpen, setIsOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Top Navigation */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">IoT Hub</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {mobileMenuOpen ? (
              <ChevronLeft className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-60px)] overflow-y-auto">
            <div className="p-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard")
                    ? "bg-green-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive("/profile")
                    ? "bg-green-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>

              {(userRole === "admin" || userRole === "supervisor") && (
                <>
                  <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
                  <div className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Admin
                  </div>

                  <Link
                    href="/admin/members"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive("/admin/members")
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Members</span>
                  </Link>

                  <Link
                    href="/admin/devices"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive("/admin/devices")
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    <Cpu className="w-5 h-5" />
                    <span>Devices</span>
                  </Link>

                  <Link
                    href="/admin/templates"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive("/admin/templates")
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Templates</span>
                  </Link>
                </>
              )}

              {/* Theme selector for mobile */}
              {mounted && (
                <div className="my-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-4">Theme</div>
                  <div className="flex gap-2 px-4">
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex-1 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 ${
                        theme === "system"
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      System
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex-1 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 ${
                        theme === "light"
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex-1 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 ${
                        theme === "dark"
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              )}

              {/* Logout for mobile */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300 z-40 ${
          isOpen ? "w-64" : "w-20"
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {isOpen && <h1 className="text-xl font-bold">IoT Hub</h1>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/dashboard")
                ? "bg-green-600 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={!isOpen ? "Dashboard" : ""}
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Dashboard</span>}
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/profile")
                ? "bg-green-600 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={!isOpen ? "Profile" : ""}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Profile</span>}
          </Link>

          {/* Admin Only */}
          {(userRole === "admin" || userRole === "supervisor") && (
            <>
              <div className={`my-4 border-t border-gray-200 dark:border-gray-700 ${!isOpen && "hidden"}`} />
              <div className={`px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase ${!isOpen && "hidden"}`}>
                Admin
              </div>

              <Link
                href="/admin/members"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/admin/members")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={!isOpen ? "Members" : ""}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>Members</span>}
              </Link>

              <Link
                href="/admin/devices"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/admin/devices")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={!isOpen ? "Devices" : ""}
              >
                <Cpu className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>Devices</span>}
              </Link>

              <Link
                href="/admin/templates"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/admin/templates")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={!isOpen ? "Templates" : ""}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>Templates</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Theme selector */}
        <div className="absolute bottom-16 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          {isOpen && mounted && (
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Theme</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("system")}
                  className={`px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-700 ${
                    theme === "system"
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  System
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-700 ${
                    theme === "light"
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-700 ${
                    theme === "dark"
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white"
            title={!isOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
