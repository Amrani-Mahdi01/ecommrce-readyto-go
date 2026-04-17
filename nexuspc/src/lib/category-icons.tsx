import {
  Monitor, Cpu, MemoryStick, HardDrive, Zap, Wind, Package, CircuitBoard,
  Keyboard, Mouse, Headphones, Speaker, Printer, Wifi, Server, Database,
  Laptop, Gamepad2, Tag, ShoppingBag, Layers, Shield, Wrench,
  Camera, Tv, Smartphone, Battery, Bluetooth, Cable, Box, LayoutGrid,
  Usb, Globe, Star, Bookmark, Fan,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ElementType> = {
  Monitor, Cpu, MemoryStick, HardDrive, Zap, Wind, Package, CircuitBoard,
  Keyboard, Mouse, Headphones, Speaker, Printer, Wifi, Server, Database,
  Laptop, Gamepad2, Tag, ShoppingBag, Layers, Shield, Wrench,
  Camera, Tv, Smartphone, Battery, Bluetooth, Cable, Box, LayoutGrid,
  Usb, Globe, Star, Bookmark, Fan,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Package;
  return <Icon className={className} />;
}
