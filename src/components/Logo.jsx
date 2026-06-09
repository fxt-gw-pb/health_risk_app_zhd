// src/components/Logo.jsx
import { Activity } from 'lucide-react';

export default function Logo({ size = 38 }) {
  return (
    <div
      className="relative grid place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
      style={{ width: size, height: size }}
    >
      <Activity size={size * 0.56} strokeWidth={2.6} className="animate-heartbeat" />
    </div>
  );
}
