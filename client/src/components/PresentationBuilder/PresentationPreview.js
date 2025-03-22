import React, { useState } from "react";

const PresentationPreview = ({ slides }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousSlide}
          disabled={currentSlideIndex === 0}
          className={`p-2 rounded-lg border border-gray-600 ${currentSlideIndex === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-700"
            }`}
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="text-sm text-gray-400">
          Slide {currentSlideIndex + 1} of {slides.length}
        </div>

        <button
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className={`p-2 rounded-lg border border-gray-600 ${currentSlideIndex === slides.length - 1
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-700"
            }`}
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Slide Display */}
      <div className="w-full max-h-[400px] aspect-[16/9] overflow-hidden bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="w-full h-full p-8 flex flex-col overflow-y-auto">
          {currentSlide.title && !currentSlide.content ? (
            <>
              <h2 className="text-3xl font-bold text-center mb-4">
                {currentSlide.title}
              </h2>
              {currentSlide.subtitle && (
                <p className="text-xl text-center text-gray-300">
                  {currentSlide.subtitle}
                </p>
              )}
            </>
          ) : currentSlide.content ? (
            <>
              <h3 className="text-2xl font-semibold mb-4">{currentSlide.title}</h3>
              <div className="text-gray-200">
                <ul className="list-disc pl-6 space-y-2">
                  {currentSlide.content.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
          {currentSlide.visualDescription && (
            <div className="mt-4 text-sm italic text-gray-400">
              <em>Visual Suggestion:</em> {currentSlide.visualDescription}
            </div>
          )}
          {currentSlide.notes && (
            <div className="mt-4 p-2 bg-gray-700 rounded-lg text-sm">
              <strong>Presenter Notes:</strong> {currentSlide.notes}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-4">
        <div className="flex gap-1">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentSlideIndex ? "bg-blue-500" : "bg-gray-400"
                }`}
              onClick={() => setCurrentSlideIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-4 overflow-x-auto pb-2">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`cursor-pointer aspect-[16/9] border-2 rounded-md overflow-hidden ${index === currentSlideIndex ? "border-blue-500" : "border-transparent"
              } min-w-[100px]`}
            onClick={() => setCurrentSlideIndex(index)}
          >
            <div className="w-full h-full bg-gray-800 p-2 flex items-center justify-center text-xs text-center truncate">
              {slide.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresentationPreview;