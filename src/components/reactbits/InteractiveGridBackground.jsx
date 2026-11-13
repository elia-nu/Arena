import { useEffect, useRef, useState } from "react";

const InteractiveGridBackground = ({
  gridSize = 48,
  lineColor = "rgba(255, 255, 255, 0.05)",
  glowColor = "rgba(254, 87, 35, 0.14)",
  dotColor = "rgba(254, 87, 35, 0.35)",
  showEmbers = true,
}) => {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{ background: "#050505" }}
    >
      {/* Base Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="arena-contact-grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke={lineColor}
              strokeWidth="1"
            />
            {/* Small intersection dot */}
            <circle cx="0" cy="0" r="1.5" fill={dotColor} />
          </pattern>

          {/* Larger 4x4 major grid */}
          <pattern
            id="arena-contact-grid-major"
            width={gridSize * 4}
            height={gridSize * 4}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={gridSize * 4}
              height={gridSize * 4}
              fill="url(#arena-contact-grid)"
            />
            <path
              d={`M ${gridSize * 4} 0 L 0 0 0 ${gridSize * 4}`}
              fill="none"
              stroke="rgba(254, 87, 35, 0.12)"
              strokeWidth="1.2"
            />
          </pattern>

          {/* Radial mask for soft fadeout at bottom */}
          <linearGradient id="fade-mask" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#arena-contact-grid-major)"
          mask="url(#fade-mask)"
        />
      </svg>

      {/* Reactive Mouse Glow Spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
        }}
      />

      {/* Ambient Atmospheric Blooms in Orange & Dark Smoke */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[160px] opacity-25"
        style={{
          background:
            "radial-gradient(circle, #fe5723 0%, rgba(254, 87, 35, 0) 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -right-48 w-[700px] h-[700px] rounded-full blur-[200px] opacity-20"
        style={{
          background:
            "radial-gradient(circle, #ff8b42 0%, rgba(255, 139, 66, 0) 70%)",
        }}
      />
      <div
        className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
        style={{
          background:
            "radial-gradient(circle, #fe5723 0%, rgba(254, 87, 35, 0) 70%)",
        }}
      />

      {/* Floating subtle ember particles */}
      {showEmbers && (
        <div className="absolute inset-0">
          {[...Array(14)].map((_, i) => {
            const size = (i % 3) + 2;
            const left = (i * 7.3) % 100;
            const top = (i * 13.7) % 100;
            const duration = 8 + (i % 7) * 2;
            const delay = (i % 5) * 1.5;

            return (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  backgroundColor: i % 2 === 0 ? "#fe5723" : "#ffffff",
                  boxShadow:
                    i % 2 === 0
                      ? "0 0 10px #fe5723, 0 0 20px rgba(254, 87, 35, 0.6)"
                      : "0 0 8px #ffffff",
                  opacity: 0.4,
                  animation: `float-particle ${duration}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Subtle Noise / Grain overlay for rich cinematic texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveGridBackground;
