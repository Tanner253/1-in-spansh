import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'soluno-home-demo-dismissed';

/**
 * Minimized autoplay demo (homepage only). `public/deeeeemo.mp4`.
 * Muted + playsInline required for autoplay in most browsers.
 */
export default function HomeDemoVideo() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || dismissed) return;
    const play = () => {
      v.play().catch(() => {});
    };
    play();
    v.addEventListener('canplay', play, { once: true });
    return () => v.removeEventListener('canplay', play);
  }, [dismissed]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (_) {}
    setDismissed(true);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  if (dismissed) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[90] w-[min(92vw,280px)] sm:w-[320px] rounded-xl overflow-hidden shadow-2xl border border-slate-600/80 bg-black"
      style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.55)' }}
    >
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-900/95 border-b border-slate-700/80">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Demo</span>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold leading-none flex items-center justify-center transition-colors"
          aria-label="Close demo video"
        >
          ×
        </button>
      </div>
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="auto"
        >
          <source src="/deeeeemo.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
