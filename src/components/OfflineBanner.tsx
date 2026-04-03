import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium shadow-md animate-in slide-in-from-top">
      <WifiOff className="h-4 w-4 shrink-0" />
      You're offline — some features may be unavailable
    </div>
  );
};

export default OfflineBanner;
