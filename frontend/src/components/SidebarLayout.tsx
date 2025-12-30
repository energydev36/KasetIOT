"use client";

import React, { ReactNode, createContext, useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ThemeProvider from "./ThemeProvider";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

interface SidebarLayoutProps {
  children: ReactNode;
  userRole?: string;
}

export default function SidebarLayout({ children, userRole }: SidebarLayoutProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem("sidebarOpen");
    if (savedState !== null) {
      setIsOpen(savedState === "true");
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebarOpen", String(isOpen));
    }
  }, [isOpen, mounted]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <ThemeProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar userRole={userRole} isOpen={isOpen} setIsOpen={setIsOpen} />
          
          {/* Content area with dynamic margin - mobile has top padding, desktop has left margin */}
          <div
            className={`flex-1 transition-all duration-300 pt-14 lg:pt-0 ${
              isOpen ? "lg:ml-64" : "lg:ml-20"
            }`}
          >
            {children}
          </div>
        </div>
      </ThemeProvider>
    </SidebarContext.Provider>
  );
}
