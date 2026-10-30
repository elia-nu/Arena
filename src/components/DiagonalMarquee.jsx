const DiagonalMarquee = ({ items = [] }) => {
  // Default items if none provided
  const defaultItems = [
    "Championship 2025",
    "Elite Tournament",
    "Weekly League",
    "Youth Championship",
    "Summer League",
    "Winter Cup",
    "Spring Tournament",
    "Fall Championship",
  ];

  const marqueeItems = items.length > 0 ? items : defaultItems;

  // Duplicate items for seamless loop
  const duplicatedItems = [...marqueeItems, ...marqueeItems];

  return (
    <>
      <style>{`
        @keyframes marquee-diagonal {
          0% {
            transform: translateX(0) rotate(-12deg);
          }
          100% {
            transform: translateX(-50%) rotate(-12deg);
          }
        }
        
        @keyframes marquee-diagonal-reverse {
          0% {
            transform: translateX(-50%) rotate(-12deg);
          }
          100% {
            transform: translateX(0) rotate(-12deg);
          }
        }
        
        .marquee-line-1 {
          animation: marquee-diagonal 30s linear infinite;
        }
        
        .marquee-line-2 {
          animation: marquee-diagonal-reverse 35s linear infinite;
        }
        
        .marquee-line-3 {
          animation: marquee-diagonal 30s linear infinite;
        }
      `}</style>
      <div className="absolute right-0 top-0 bottom-0 w-[500px] md:w-[600px] overflow-hidden pointer-events-none hidden md:block">
        {/* Line 1 - Top */}
        <div className="absolute top-[15%] right-0 origin-right overflow-visible">
          <div className="flex whitespace-nowrap marquee-line-1">
            {duplicatedItems.map((item, index) => (
              <span
                key={`line1-${index}`}
                className="mx-8 text-6xl md:text-7xl font-black text-secondary-50/10 select-none inline-block"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Line 2 - Middle */}
        <div className="absolute top-[45%] right-0 origin-right overflow-visible">
          <div className="flex whitespace-nowrap marquee-line-2">
            {duplicatedItems.map((item, index) => (
              <span
                key={`line2-${index}`}
                className="mx-8 text-6xl md:text-7xl font-black text-secondary-50/10 select-none inline-block"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Line 3 - Bottom */}
        <div className="absolute top-[75%] right-0 origin-right overflow-visible">
          <div className="flex whitespace-nowrap marquee-line-3">
            {duplicatedItems.map((item, index) => (
              <span
                key={`line3-${index}`}
                className="mx-8 text-6xl md:text-7xl font-black text-secondary-50/10 select-none inline-block"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DiagonalMarquee;
