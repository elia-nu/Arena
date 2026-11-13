const ShinyText = ({
  text,
  disabled = false,
  speed = 4,
  className = "",
  shimmerColor = "rgba(255, 255, 255, 0.9)",
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block relative overflow-hidden select-none ${className}`}
      style={{
        backgroundImage: disabled
          ? "none"
          : `linear-gradient(120deg, currentColor 0%, currentColor 38%, ${shimmerColor} 50%, currentColor 62%, currentColor 100%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: disabled ? "inherit" : "transparent",
        animation: disabled
          ? "none"
          : `shiny-text ${animationDuration} ease-in-out infinite`,
      }}
    >
      {text}
      <style>{`
        @keyframes shiny-text {
          0% {
            background-position: 150% 0;
          }
          100% {
            background-position: -150% 0;
          }
        }
      `}</style>
    </span>
  );
};

export default ShinyText;
