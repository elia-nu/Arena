import { useEffect, useState, useRef } from "react";

const CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]";

const DecryptedText = ({
  text = "",
  speed = 40,
  maxIterations = 12,
  sequential = true,
  animateOn = "view",
  className = "",
  parentClassName = "",
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = CHAR_SET,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef(null);

  const getNextChar = (original) => {
    if (original === " " || original === "\n") return original;
    if (useOriginalCharsOnly) {
      const distinct = Array.from(new Set(text.replace(/\s/g, "")));
      return distinct[Math.floor(Math.random() * distinct.length)] || original;
    }
    return characters[Math.floor(Math.random() * characters.length)];
  };

  const triggerAnimation = () => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(() => {
        return text
          .split("")
          .map((char, index) => {
            if (char === " " || char === "\n") return char;

            let shouldReveal = false;
            if (sequential) {
              const progress = iteration / maxIterations;
              const threshold =
                revealDirection === "end"
                  ? (text.length - 1 - index) / text.length
                  : index / text.length;
              shouldReveal = progress > threshold;
            } else {
              shouldReveal = iteration >= maxIterations;
            }

            if (shouldReveal) {
              return char;
            }
            return getNextChar(char);
          })
          .join("");
      });

      iteration += 1;
      if (iteration > maxIterations + 4) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, speed);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (animateOn === "view") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              triggerAnimation();
              setHasAnimated(true);
            }
          });
        },
        { threshold: 0.2 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }
  }, [text, animateOn, hasAnimated]);

  const handleMouseEnter = () => {
    if (animateOn === "hover") {
      setIsHovered(true);
      triggerAnimation();
    }
  };

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      className={`inline-block ${parentClassName}`}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
};

export default DecryptedText;
