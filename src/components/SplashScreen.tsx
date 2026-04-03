import { useState, useEffect } from "react";

const SplashScreen = ({ onFinished }: { onFinished: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1200);
    const remove = setTimeout(onFinished, 1800);
    return () => {
      clearTimeout(timer);
      clearTimeout(remove);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-light transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src="/logo_3.png"
        alt="VLookup Cloud"
        width={96}
        height={96}
        className="rounded-2xl shadow-2xl mb-5 animate-in zoom-in-50 duration-500"
      />
      <h1 className="text-2xl font-bold text-primary-foreground animate-in fade-in duration-700">
        VLookup Cloud
      </h1>
      <p className="text-sm text-primary-foreground/70 mt-1 animate-in fade-in duration-700 delay-200">
        Powered By LiveGig Ltd
      </p>
    </div>
  );
};

export default SplashScreen;
