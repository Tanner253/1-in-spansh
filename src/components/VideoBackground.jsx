import React, { useEffect, useRef } from 'react';

export default function VideoBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/deeeeemo.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/70" />
    </div>
  );
}
