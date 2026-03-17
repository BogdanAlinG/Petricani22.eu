import {
  DoorOpen, Wifi, ScrollText, ParkingSquare, MapPin, Utensils, Coffee,
  Tv, Thermometer, Key, Car, Bus, ShoppingBag, Phone, AlertCircle,
  Trash2, Droplets, Zap, BookOpen, Info, Star, Heart, Clock, Lock,
  Camera, Music, Flower2, Flame, Waves, TreePine,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DoorOpen, Wifi, ScrollText, ParkingSquare, MapPin, Utensils, Coffee,
  Tv, Thermometer, Key, Car, Bus, ShoppingBag, Phone, AlertCircle,
  Trash2, Droplets, Zap, BookOpen, Info, Star, Heart, Clock, Lock,
  Camera, Music, Flower2, Flame, Waves, TreePine,
};

interface GuidebookIconProps {
  name: string;
  className?: string;
}

export default function GuidebookIcon({ name, className = 'w-5 h-5' }: GuidebookIconProps) {
  const Icon = iconMap[name] || BookOpen;
  return <Icon className={className} />;
}
