import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showBackOnlineToast, setShowBackOnlineToast] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineToast(true);
      const timer = setTimeout(() => setShowBackOnlineToast(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md animate-pulse">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>You are currently offline. Internet connection is required to save transactions to PostgreSQL.</span>
      </div>
    );
  }

  if (showBackOnlineToast) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-300">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>Connected to DairyPureOrganic Cloud Database</span>
      </div>
    );
  }

  return null;
};
