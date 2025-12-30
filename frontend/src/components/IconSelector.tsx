"use client";

import React, { useState } from "react";
import {
  Lightbulb, Plug, Power, Zap, Battery, BatteryCharging,
  Thermometer, Droplet, Droplets, Waves, Wind, Fan,
  Flame, Snowflake, Sun, Moon, Star, Cloud, CloudRain, CloudSnow,
  Volume2, Speaker, Bell, BellOff,
  DoorOpen, DoorClosed, Home, Building, Building2, Warehouse,
  Car, Tractor, Wheat, Sprout, Leaf, Trees, Flower, Flower2,
  Bug, Fish, Bird,
  Clock, Timer, AlarmClock, Calendar,
  BarChart, BarChart2, LineChart, TrendingUp, TrendingDown, Activity,
  Gauge, Sliders, Settings, Settings2,
  Radio, Wifi, WifiOff, Bluetooth,
  Smartphone, Laptop, Monitor, Keyboard, Mouse, Printer, Camera, Video, Flashlight,
  Lock, Unlock, Key, Shield, ShieldCheck,
  Cog, Wrench, Hammer, Pickaxe, Axe,
  Globe, Satellite, Rocket,
  CircuitBoard, Cpu, HardDrive, Database, Server,
  Box, Package, Archive,
  ThermometerSun, ThermometerSnowflake,
  Eye, EyeOff, Maximize, Minimize,
  Play, Pause, Square, Circle,
  Check, CheckCircle, X, XCircle,
  Plus, Minus,
  AlertCircle, AlertTriangle, Info, HelpCircle,
  ChevronDown
} from "lucide-react";

// Icon registry - map icon names to components
export const IconRegistry: Record<string, any> = {
  Lightbulb, Plug, Power, Zap, Battery, BatteryCharging,
  Thermometer, Droplet, Droplets, Waves, Wind, Fan,
  Flame, Snowflake, Sun, Moon, Star, Cloud, CloudRain, CloudSnow,
  Volume2, Speaker, Bell, BellOff,
  DoorOpen, DoorClosed, Home, Building, Building2, Warehouse,
  Car, Tractor, Wheat, Sprout, Leaf, Trees, Flower, Flower2,
  Bug, Fish, Bird,
  Clock, Timer, AlarmClock, Calendar,
  BarChart, BarChart2, LineChart, TrendingUp, TrendingDown, Activity,
  Gauge, Sliders, Settings, Settings2,
  Radio, Wifi, WifiOff, Bluetooth,
  Smartphone, Laptop, Monitor, Keyboard, Mouse, Printer, Camera, Video, Flashlight,
  Lock, Unlock, Key, Shield, ShieldCheck,
  Cog, Wrench, Hammer, Pickaxe, Axe,
  Globe, Satellite, Rocket,
  CircuitBoard, Cpu, HardDrive, Database, Server,
  Box, Package, Archive,
  ThermometerSun, ThermometerSnowflake,
  Eye, EyeOff, Maximize, Minimize,
  Play, Pause, Square, Circle,
  Check, CheckCircle, X, XCircle,
  Plus, Minus,
  AlertCircle, AlertTriangle, Info, HelpCircle,
  ChevronDown
};

// Lucide icons list - commonly used icons
export const LUCIDE_ICONS = [
  { value: "Lightbulb", label: "หลอดไฟ" },
  { value: "Plug", label: "ปลั๊กไฟ" },
  { value: "Power", label: "พลังงาน" },
  { value: "Zap", label: "ไฟฟ้า" },
  { value: "Battery", label: "แบตเตอรี่" },
  { value: "BatteryCharging", label: "กำลังชาร์จ" },
  { value: "Thermometer", label: "อุณหภูมิ" },
  { value: "Droplet", label: "น้ำ" },
  { value: "Droplets", label: "หยดน้ำ" },
  { value: "Waves", label: "คลื่นน้ำ" },
  { value: "Wind", label: "ลม" },
  { value: "Fan", label: "พัดลม" },
  { value: "Flame", label: "ไฟ" },
  { value: "Snowflake", label: "เย็น/แอร์" },
  { value: "Sun", label: "แสงแดด" },
  { value: "Moon", label: "กลางคืน" },
  { value: "Star", label: "ดาว" },
  { value: "Cloud", label: "เมฆ" },
  { value: "CloudRain", label: "ฝนตก" },
  { value: "CloudSnow", label: "หิมะตก" },
  { value: "Volume2", label: "เสียง" },
  { value: "Speaker", label: "ลำโพง" },
  { value: "Bell", label: "กระดิ่ง" },
  { value: "BellOff", label: "ปิดเสียง" },
  { value: "DoorOpen", label: "ประตูเปิด" },
  { value: "DoorClosed", label: "ประตูปิด" },
  { value: "Home", label: "บ้าน" },
  { value: "Building", label: "อาคาร" },
  { value: "Building2", label: "อาคาร 2" },
  { value: "Warehouse", label: "โกดัง" },
  { value: "Car", label: "รถยนต์" },
  { value: "Tractor", label: "รถไถ" },
  { value: "Wheat", label: "ข้าว" },
  { value: "Sprout", label: "ต้นกล้า" },
  { value: "Leaf", label: "ใบไม้" },
  { value: "Trees", label: "ต้นไม้" },
  { value: "Flower", label: "ดอกไม้" },
  { value: "Flower2", label: "ดอกไม้ 2" },
  { value: "Bug", label: "แมลง" },
  { value: "Fish", label: "ปลา" },
  { value: "Bird", label: "นก" },
  { value: "Clock", label: "นาฬิกา" },
  { value: "Timer", label: "ตั้งเวลา" },
  { value: "AlarmClock", label: "นาฬิกาปลุก" },
  { value: "Calendar", label: "ปฏิทิน" },
  { value: "BarChart", label: "กราฟแท่ง" },
  { value: "BarChart2", label: "กราฟแท่ง 2" },
  { value: "LineChart", label: "กราฟเส้น" },
  { value: "TrendingUp", label: "กราฟขึ้น" },
  { value: "TrendingDown", label: "กราฟลง" },
  { value: "Activity", label: "กิจกรรม" },
  { value: "Gauge", label: "มาตรวัด" },
  { value: "Sliders", label: "ปรับระดับ" },
  { value: "Settings", label: "ตั้งค่า" },
  { value: "Settings2", label: "ตั้งค่า 2" },
  { value: "Radio", label: "วิทยุ" },
  { value: "Wifi", label: "ไวไฟ" },
  { value: "WifiOff", label: "ไวไฟปิด" },
  { value: "Bluetooth", label: "บลูทูธ" },
  { value: "Smartphone", label: "มือถือ" },
  { value: "Laptop", label: "คอมพิวเตอร์" },
  { value: "Monitor", label: "จอคอมพิวเตอร์" },
  { value: "Keyboard", label: "คีย์บอร์ด" },
  { value: "Mouse", label: "เมาส์" },
  { value: "Printer", label: "เครื่องพิมพ์" },
  { value: "Camera", label: "กล้อง" },
  { value: "Video", label: "วิดีโอ" },
  { value: "Flashlight", label: "ไฟฉาย" },
  { value: "Lock", label: "ล็อค" },
  { value: "Unlock", label: "ปลดล็อค" },
  { value: "Key", label: "กุญแจ" },
  { value: "Shield", label: "โล่" },
  { value: "ShieldCheck", label: "ปลอดภัย" },
  { value: "Cog", label: "เฟือง" },
  { value: "Wrench", label: "ประแจ" },
  { value: "Hammer", label: "ค้อน" },
  { value: "Pickaxe", label: "จอบแหลม" },
  { value: "Axe", label: "ขวาน" },
  { value: "Globe", label: "โลก" },
  { value: "Satellite", label: "ดาวเทียม" },
  { value: "Rocket", label: "จรวด" },
  { value: "CircuitBoard", label: "แผงวงจร" },
  { value: "Cpu", label: "ซีพียู" },
  { value: "HardDrive", label: "ฮาร์ดไดรฟ์" },
  { value: "Database", label: "ฐานข้อมูล" },
  { value: "Server", label: "เซิร์ฟเวอร์" },
  { value: "Box", label: "กล่อง" },
  { value: "Package", label: "แพคเกจ" },
  { value: "Archive", label: "เก็บถาวร" },
  { value: "ThermometerSun", label: "อุณหภูมิร้อน" },
  { value: "ThermometerSnowflake", label: "อุณหภูมิเย็น" },
  { value: "Eye", label: "ตา" },
  { value: "EyeOff", label: "ซ่อน" },
  { value: "Maximize", label: "ขยาย" },
  { value: "Minimize", label: "ย่อ" },
  { value: "Play", label: "เล่น" },
  { value: "Pause", label: "หยุด" },
  { value: "Square", label: "สี่เหลี่ยม" },
  { value: "Circle", label: "วงกลม" },
  { value: "Check", label: "ติ๊ก" },
  { value: "CheckCircle", label: "ติ๊กวงกลม" },
  { value: "X", label: "กากบาท" },
  { value: "XCircle", label: "กากบาทวงกลม" },
  { value: "Plus", label: "บวก" },
  { value: "Minus", label: "ลบ" },
  { value: "AlertCircle", label: "แจ้งเตือน" },
  { value: "AlertTriangle", label: "เตือนสามเหลี่ยม" },
  { value: "Info", label: "ข้อมูล" },
  { value: "HelpCircle", label: "ช่วยเหลือ" },
];

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function IconSelector({ value, onChange, className = "" }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = LUCIDE_ICONS.filter(
    (icon) =>
      icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const IconComponent = value && IconRegistry[value] 
    ? IconRegistry[value] 
    : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between ${className}`}
      >
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent size={20} />}
          <span className="text-sm">
            {value ? LUCIDE_ICONS.find((i) => i.value === value)?.label || value : "-- เลือก Icon --"}
          </span>
        </div>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="ค้นหา icon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-80 p-2">
              <div className="grid grid-cols-1 gap-1">
                {filteredIcons.map((icon) => {
                  const Icon = IconRegistry[icon.value];
                  if (!Icon) return null; // Skip if icon doesn't exist
                  return (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => {
                        onChange(icon.value);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
                        value === icon.value ? "bg-green-50 dark:bg-green-900/20" : ""
                      }`}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {icon.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
