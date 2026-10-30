import { useState, useEffect } from "react";
import { testimonialAPI } from "../services/api";

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wrap in try-catch to prevent crashes
    try {
      fetchTestimonials();
    } catch (err) {
      console.error("Error initializing testimonials:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await testimonialAPI.getAll({ status: "published" });
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      setError(err.message || "Failed to load testimonials");
      // Fallback to empty array if API fails
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(3);
      } else if (window.innerWidth >= 768) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  // Auto-play - MUST be called before any conditional returns
  useEffect(() => {
    if (testimonials.length === 0) return;
    const maxIdx = Math.max(0, testimonials.length - itemsPerView);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length, itemsPerView]);

  // Hide section while loading, on error, or when there are no testimonials
  if (loading || error || testimonials.length === 0) {
    return null;
  }

  const maxIndex = Math.max(0, testimonials.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <section className="py-20 md:py-28 px-4 md:px-8 bg-gradient-to-b from-secondary-50/40 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <span className="inline-block text-secondary-500 text-sm font-semibold uppercase tracking-wider mb-3">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 tracking-tight">
            What Families Say
          </h2>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto leading-relaxed">
            Join thousands of satisfied families who have experienced the thrill
            of our events
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-10 z-10 w-11 h-11 flex items-center justify-center bg-white border border-primary-200 rounded-full shadow-md hover:shadow-lg hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 active:scale-95"
            aria-label="Previous testimonial"
          >
            <svg
              className="w-5 h-5 text-primary-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-10 z-10 w-11 h-11 flex items-center justify-center bg-white border border-primary-200 rounded-full shadow-md hover:shadow-lg hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 active:scale-95"
            aria-label="Next testimonial"
          >
            <svg
              className="w-5 h-5 text-primary-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Slider */}
          <div className="overflow-hidden mx-6 md:mx-14">
            <div
              className="flex items-stretch transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className="min-w-full md:min-w-[50%] lg:min-w-[33.333%] px-2 md:px-3 flex"
                >
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-primary-100 hover:shadow-xl hover:border-primary-200/80 transition-all duration-300 h-full w-full max-w-md mx-auto flex flex-col relative overflow-hidden min-h-[320px]">
                    {/* Large quote mark */}
                    <span className="absolute top-5 right-5 text-5xl md:text-6xl font-serif text-secondary-200/50 leading-none select-none pointer-events-none" aria-hidden>
                      "
                    </span>

                    {/* Rating */}
                    <div className="flex gap-0.5 mb-3" aria-label={`${testimonial.rating || 5} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 shrink-0 ${i <= (testimonial.rating || 5) ? "text-amber-400" : "text-primary-200"}`}
                          fill={i <= (testimonial.rating || 5) ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote — flex-1 + min-h so author stays at bottom; line-clamp for consistent height */}
                    <p className="text-primary-700 text-sm  leading-relaxed mb-5 flex-1 min-h-[4.5rem] line-clamp-6">
                      {testimonial.quote}
                    </p>

                    {/* Author — always at bottom */}
                    <div className="flex items-center gap-3 pt-4 mt-auto border-t border-primary-100 shrink-0">
                      {testimonial.avatar ? (
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-primary-100 flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center text-secondary-700 font-bold text-base flex-shrink-0 ${testimonial.avatar ? "hidden" : ""}`}
                        aria-hidden
                      >
                        {testimonial.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-primary-900 truncate text-sm md:text-base">
                          {testimonial.name}
                        </p>
                        <p className="text-xs md:text-sm text-primary-500 truncate">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicator Dots */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "h-2.5 w-8 bg-secondary-500"
                    : "h-2 w-2 bg-primary-300 hover:bg-primary-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
