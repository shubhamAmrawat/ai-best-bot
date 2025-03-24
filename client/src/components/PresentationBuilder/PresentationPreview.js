import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const PresentationPreview = ({ slides, initialTheme }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  // Define available themes (same as in PresentationBuilder, but with styling)
  const themeStyles = {
    "modern-blue": {
      name: "Modern Blue",
      background: "bg-gradient-to-br from-blue-900 to-blue-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-blue-400 to-purple-500",
      font: "font-sans",
    },
    "vibrant-orange": {
      name: "Vibrant Orange",
      background: "bg-gradient-to-br from-orange-900 to-orange-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-orange-400 to-red-500",
      font: "font-sans",
    },
    "minimalist-white": {
      name: "Minimalist White",
      background: "bg-white",
      text: "text-gray-900",
      accent: "bg-gradient-to-r from-gray-300 to-gray-500",
      font: "font-serif",
    },
    "forest-green": {
      name: "Forest Green",
      background: "bg-gradient-to-br from-green-900 to-green-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-green-400 to-teal-500",
      font: "font-sans",
    },
    "sunset-pink": {
      name: "Sunset Pink",
      background: "bg-gradient-to-br from-pink-900 to-pink-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-pink-400 to-purple-500",
      font: "font-sans",
    },
    "midnight-purple": {
      name: "Midnight Purple",
      background: "bg-gradient-to-br from-purple-900 to-purple-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-purple-400 to-indigo-500",
      font: "font-sans",
    },
    "ocean-teal": {
      name: "Ocean Teal",
      background: "bg-gradient-to-br from-teal-900 to-teal-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-teal-400 to-cyan-500",
      font: "font-sans",
    },
    "golden-sunset": {
      name: "Golden Sunset",
      background: "bg-gradient-to-br from-yellow-900 to-yellow-600",
      text: "text-gray-800",
      accent: "bg-gradient-to-r from-yellow-400 to-orange-500",
      font: "font-sans",
    },
    "crimson-red": {
      name: "Crimson Red",
      background: "bg-gradient-to-br from-red-900 to-red-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-red-400 to-pink-500",
      font: "font-sans",
    },
    "slate-gray": {
      name: "Slate Gray",
      background: "bg-gradient-to-br from-gray-900 to-gray-600",
      text: "text-white",
      accent: "bg-gradient-to-r from-gray-400 to-blue-500",
      font: "font-sans",
    },
  };

  const appliedTheme = themeStyles[currentTheme] || themeStyles["modern-blue"];

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      const thumbnailElement = document.querySelector(`#thumbnail-${currentSlideIndex + 1}`);
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      const thumbnailElement = document.querySelector(`#thumbnail-${currentSlideIndex - 1}`);
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentSlideIndex(index);
    const thumbnailElement = document.querySelector(`#thumbnail-${index}`);
    if (thumbnailElement) {
      thumbnailElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const currentSlide = slides[currentSlideIndex];

  const renderSlideContent = (slide) => {
    switch (slide.slideType) {
      case "title":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-xl text-gray-300">{slide.subtitle}</p>
            )}
          </motion.div>
        );

      case "content":
        if (slide.layout === "text-left-image-right") {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row h-full"
            >
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <h3 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  {slide.title}
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-200">
                  {slide.content.map((bullet, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      {bullet}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2 p-6 flex items-center justify-center">
                <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 italic">
                  Image: {slide.visualDescription}
                </div>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 flex flex-col h-full"
          >
            <h3 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              {slide.title}
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-200">
              {slide.content.map((bullet, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  {bullet}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        );

      case "quote":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <blockquote className="text-2xl italic text-gray-200 mb-4">
              "{slide.quote}"
            </blockquote>
            <p className="text-lg text-gray-400">— {slide.attribution}</p>
          </motion.div>
        );

      case "image":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-full"
          >
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 italic">
              Full-width Image: {slide.visualDescription}
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-2xl font-semibold text-white bg-black/50 p-2 rounded-lg">
                {slide.title}
              </h3>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-row h-full space-x-6">
      {/* Left Sidebar: Thumbnails */}
      <div className="w-56 flex-shrink-0 max-h-[510px] overflow-y-auto scrollbar-hidden">
        <div className="flex flex-col">
          {slides.map((slide, index) => (
            <div
              id={`thumbnail-${index}`}
              key={index}
              className={`flex-shrink-0 h-[120px] w-full border-2 rounded-lg overflow-hidden transition-all duration-300 group ${index === currentSlideIndex
                  ? `${appliedTheme.accent} shadow-lg shadow-purple-500/20`
                  : "border-gray-700/50 hover:border-gray-500"
                } cursor-pointer backdrop-blur-sm bg-white/5 mb-2`}
              onClick={() => handleThumbnailClick(index)}
            >
              <div className="w-full h-full p-3 flex items-center justify-center text-sm text-center truncate text-gray-300 group-hover:text-white">
                {slide.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Main Area: Slide Display */}
      <div className="flex-1 flex flex-col space-y-6">
        {/* Navigation Controls and Theme Selector */}
        <div className="flex justify-between items-center">
          <button
            onClick={goToPreviousSlide}
            disabled={currentSlideIndex === 0}
            className={`p-2 rounded-lg border border-gray-700/50 bg-gray-800/80 transition-all duration-300 ${currentSlideIndex === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/20"
              }`}
          >
            <ChevronLeft className="h-5 w-5 text-gray-300" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-300">
              Slide {currentSlideIndex + 1} of {slides.length}
            </div>
            <select
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value)}
              className="p-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(themeStyles).map((themeKey) => (
                <option key={themeKey} value={themeKey}>
                  {themeStyles[themeKey].name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={goToNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className={`p-2 rounded-lg border border-gray-700/50 bg-gray-800/80 transition-all duration-300 ${currentSlideIndex === slides.length - 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/20"
              }`}
          >
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        {/* Slide Display */}
        <div
          className={`w-full max-h-[400px] aspect-[16/9] overflow-hidden backdrop-blur-sm ${appliedTheme.background} rounded-2xl border border-gray-700/50 shadow-xl flex items-center justify-center ${appliedTheme.font}`}
        >
          <div className={`w-full h-full ${appliedTheme.text}`}>
            {renderSlideContent(currentSlide)}
            {currentSlide.visualDescription && currentSlide.slideType !== "image" && (
              <div className="mt-4 text-sm italic text-gray-400 px-6">
                <em>Visual Suggestion:</em> {currentSlide.visualDescription}
              </div>
            )}
            {currentSlide.notes && (
              <div className="mt-4 p-2 bg-gray-700/50 rounded-lg text-sm border border-gray-600/50 mx-6">
                <strong>Presenter Notes:</strong> {currentSlide.notes}
              </div>
            )}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlideIndex
                    ? `${appliedTheme.accent} scale-125`
                    : "bg-gray-400 hover:bg-gray-300"
                  }`}
                onClick={() => handleThumbnailClick(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationPreview;