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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-900 dark:text-white"
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
          <div className="fixed inset-x-0 top-[57px] bottom-0 bg-white dark:bg-gray-900 overflow-y-auto flex flex-col">
            <div className="p-4 space-y-2 flex-1">
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
                <span>แดชบอร์ด</span>
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
                <span>โปรไฟล์</span>
              </Link>

              {(userRole === "admin" || userRole === "supervisor") && (
                <>
                  <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
                  <div className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    แอดมิน
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
                    <span>สมาชิก</span>
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
                    <span>อุปกรณ์</span>
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
                    <span>เทมเพลต</span>
                  </Link>
                </>
              )}

            </div>

            {/* Theme selector and Logout - Always at bottom */}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700">
              {/* Theme selector for mobile */}
              {mounted && (
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">ธีม</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex-1 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                        theme === "system"
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      ระบบ
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex-1 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                        theme === "light"
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      สว่าง
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex-1 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                        theme === "dark"
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      มืด
                    </button>
                  </div>
                </div>
              )}

              {/* Logout for mobile */}
              <div className="p-4 pt-0">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white"
                >
                  <LogOut className="w-5 h-5" />
                  <span>ออกจากระบบ</span>
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
            title={!isOpen ? "แดชบอร์ด" : ""}
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>แดชบอร์ด</span>}
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/profile")
                ? "bg-green-600 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={!isOpen ? "โปรไฟล์" : ""}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>โปรไฟล์</span>}
          </Link>

          {/* Admin Only */}
          {(userRole === "admin" || userRole === "supervisor") && (
            <>
              <div className={`my-4 border-t border-gray-200 dark:border-gray-700 ${!isOpen && "hidden"}`} />
              <div className={`px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase ${!isOpen && "hidden"}`}>
                แอดมิน
              </div>

              <Link
                href="/admin/members"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/admin/members")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={!isOpen ? "สมาชิก" : ""}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>สมาชิก</span>}
              </Link>

              <Link
                href="/admin/devices"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/admin/devices")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={!isOpen ? "อุปกรณ์" : ""}
              >
                <Cpu className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>อุปกรณ์</span>}
              </Link>

              <Link
                href="/admin/templates"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/admin/templates")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={!isOpen ? "เทมเพลต" : ""}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>เทมเพลต</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Theme selector */}
        <div className="absolute bottom-16 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          {isOpen && mounted && (
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">ธีม</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("system")}
                  className={`px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                    theme === "system"
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  ระบบ
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                    theme === "light"
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  สว่าง
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                    theme === "dark"
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  มืด
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
            title={!isOpen ? "ออกจากระบบ" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
