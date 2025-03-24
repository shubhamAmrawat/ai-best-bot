import React, { useState, useEffect } from "react";
import axios from "axios";
import PresentationPreview from "./PresentationPreview";
import { MoveLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PptxGenJS from "pptxgenjs"; // Import pptxgenjs

const PresentationBuilder = ({ user }) => {
  const avatarLetter = user.username.charAt(0).toUpperCase();
  const [topic, setTopic] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [theme, setTheme] = useState("modern-blue"); // Default theme
  const [slides, setSlides] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add loading state for saving
  const [presentationTitle, setPresentationTitle] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [pastPresentations, setPastPresentations] = useState([]); // Still needed for rendering
  const navigate = useNavigate();

  // Define available themes (with PPT-compatible colors)
  const themeStyles = {
    "modern-blue": {
      name: "Modern Blue",
      background: "1F2A44",
      text: "FFFFFF",
      accent: "4A90E2",
    },
    "vibrant-orange": {
      name: "Vibrant Orange",
      background: "F5F5F5",
      text: "333333",
      accent: "FF9500",
    },
    "minimalist-white": {
      name: "Minimalist White",
      background: "FFFFFF",
      text: "333333",
      accent: "CCCCCC",
    },
    "forest-green": {
      name: "Forest Green",
      background: "2E3B2F",
      text: "FFFFFF",
      accent: "8BC34A",
    },
    "sunset-pink": {
      name: "Sunset Pink",
      background: "FFF5F5",
      text: "333333",
      accent: "FF6F61",
    },
    "midnight-purple": {
      name: "Midnight Purple",
      background: "2C1E3A",
      text: "FFFFFF",
      accent: "9B59B6",
    },
    "ocean-teal": {
      name: "Ocean Teal",
      background: "E0F7FA",
      text: "333333",
      accent: "26A69A",
    },
    "golden-sunset": {
      name: "Golden Sunset",
      background: "FFF9E6",
      text: "333333",
      accent: "FFB300",
    },
    "crimson-red": {
      name: "Crimson Red",
      background: "3E1F1F",
      text: "FFFFFF",
      accent: "EF5350",
    },
    "slate-gray": {
      name: "Slate Gray",
      background: "37474F",
      text: "FFFFFF",
      accent: "78909C",
    },
  };

  // Fetch past presentations from the backend
  const fetchPastPresentations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/presentations/history",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("Fetched past presentations:", response.data); // Debug log
      setPastPresentations(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch past presentations:",
        error.response?.data || error.message
      );
      alert("Failed to fetch past presentations. Please try again.");
    }
  };

  // Fetch presentations when the component mounts
  useEffect(() => {
    fetchPastPresentations();
  }, []); // Empty dependency array to run on mount

  // Re-fetch presentations when the "History" tab is accessed to ensure the list is up-to-date
  useEffect(() => {
    if (activeTab === "history") {
      fetchPastPresentations();
    }
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!topic || !theme) return;

    setIsGenerating(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/presentations/generate",
        {
          topic,
          outline: additionalInfo.trim() || undefined,
          theme, // Include the selected theme
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const result = response.data;
      setSlides(result.slides);
      setPresentationTitle(result.slides[0]?.title || "Untitled Presentation");
      setActiveTab("preview");

      // Refresh the history after generating a new presentation
      fetchPastPresentations();
    } catch (error) {
      console.error(
        "Failed to generate presentation:",
        error.response?.data || error.message
      );
      alert("Failed to generate presentation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true); // Set loading state
    try {
      // Initialize pptxgenjs
      const pptx = new PptxGenJS();

      // Set presentation properties
      pptx.layout = "LAYOUT_WIDE"; // 16:9 layout
      pptx.title = presentationTitle;

      // Get the theme colors
      const themeColors = themeStyles[theme];

      // Add slides
      slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();

        // Apply theme background and text color
        slide.background = { color: themeColors.background };
        slide.color = themeColors.text;

        // Add content based on slide type
        if (slideData.type === "title") {
          slide.addText(presentationTitle, {
            x: 0.5,
            y: 1.0,
            w: "90%",
            h: 1.5,
            fontSize: 44,
            bold: true,
            align: "center",
            color: themeColors.text,
          });
          if (slideData.subtitle) {
            slide.addText(slideData.subtitle, {
              x: 0.5,
              y: 3.0,
              w: "90%",
              h: 1.0,
              fontSize: 24,
              align: "center",
              color: themeColors.text,
            });
          }
        } else if (slideData.type === "content") {
          slide.addText(slideData.title, {
            x: 0.5,
            y: 0.5,
            w: "90%",
            h: 1.0,
            fontSize: 36,
            bold: true,
            color: themeColors.text,
          });
          slide.addText(slideData.content, {
            x: 0.5,
            y: 1.8,
            w: "90%",
            h: 4.0,
            fontSize: 20,
            color: themeColors.text,
            bullet: true,
          });
        } else if (slideData.type === "quote") {
          slide.addText(`"${slideData.quote}"`, {
            x: 0.5,
            y: 1.5,
            w: "90%",
            h: 2.0,
            fontSize: 28,
            italic: true,
            align: "center",
            color: themeColors.text,
          });
          if (slideData.author) {
            slide.addText(`- ${slideData.author}`, {
              x: 0.5,
              y: 4.0,
              w: "90%",
              h: 1.0,
              fontSize: 20,
              align: "center",
              color: themeColors.text,
            });
          }
        } else if (slideData.type === "image") {
          // For now, treat image slides as text placeholders
          slide.addText(`Image: ${slideData.visualDescription}`, {
            x: 0.5,
            y: 1.5,
            w: "90%",
            h: 2.0,
            fontSize: 24,
            align: "center",
            color: themeColors.text,
          });
          if (slideData.caption) {
            slide.addText(slideData.caption, {
              x: 0.5,
              y: 4.0,
              w: "90%",
              h: 1.0,
              fontSize: 18,
              align: "center",
              color: themeColors.text,
            });
          }
        }

        // Add slide number
        slide.addText(`Slide ${index + 1} of ${slides.length}`, {
          x: 0.5,
          y: 6.5,
          w: "90%",
          h: 0.5,
          fontSize: 14,
          align: "right",
          color: themeColors.accent,
        });
      });

      // Save the presentation using writeFile (asynchronous)
      await pptx.writeFile({
        fileName: `${presentationTitle.replace(/\s+/g, "_")}_presentation.pptx`,
      });
      console.log("Presentation saved successfully!");
    } catch (error) {
      console.error("Failed to save presentation:", error);
      alert("Failed to save presentation as PPT. Please try again.");
    } finally {
      setIsSaving(false); // Reset loading state
    }
  };

  const goToLandingPage = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-black text-white overflow-auto">
      {/* Header and User Profile */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg
              class
              name="w-8 h-8 text-purple-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-300">{user.username}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20">
              {avatarLetter}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="container mx-auto px-4">
        <div className="flex items-center border-b border-gray-800/60 mb-8">
          {/* Home Icon (Left-Aligned) */}
          <button onClick={goToLandingPage} className="mr-auto">
            <MoveLeftIcon size={24} className="text-blue-300" />
          </button>

          {/* Tabs (Centered) */}
          <div className="flex-1 flex justify-center space-x-6">
            <button
              className={`px-6 py-3 text-base font-medium transition-all duration-300 relative ${
                activeTab === "create"
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("create")}
            >
              Create
              {activeTab === "create" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-500"></span>
              )}
            </button>
            <button
              className={`px-6 py-3 text-base font-medium transition-all duration-300 relative ${
                activeTab === "preview"
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              } ${slides.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => slides.length > 0 && setActiveTab("preview")}
              disabled={slides.length === 0}
            >
              Preview
              {activeTab === "preview" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-500"></span>
              )}
            </button>
            <button
              className={`px-6 py-3 text-base font-medium transition-all duration-300 relative ${
                activeTab === "history"
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              } ${
                pastPresentations.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => setActiveTab("history")} // Always allow clicking to fetch the latest data
            >
              History
              {activeTab === "history" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-500"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        {/* Create Tab */}
        {activeTab === "create" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Create AI-Powered Presentations
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Transform your ideas into professional slides in seconds with
                our AI presentation generator.
              </p>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-gray-700/50 shadow-xl p-8">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="topic"
                    className="block text-sm font-medium mb-2 text-gray-300"
                  >
                    Presentation Topic
                  </label>
                  <div className="relative">
                    <input
                      id="topic"
                      placeholder="Enter your presentation topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-gray-900/80 text-white p-4 pl-10 rounded-xl border border-gray-700/50 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 placeholder-gray-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9.37 5.51c-.18.64-.27 1.31-.27 1.99 0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 14.93 19 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="additionalInfo"
                    className="block text-sm font-medium mb-2 text-gray-300"
                  >
                    Additional Information (optional)
                  </label>
                  <div className="relative">
                    <textarea
                      id="additionalInfo"
                      placeholder="Add any specific requirements, number of slides, style preferences, etc."
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      rows={4}
                      className="w-full bg-gray-900/80 text-white p-4 pl-10 rounded-xl border border-gray-700/50 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 placeholder-gray-500"
                    ></textarea>
                    <div className="absolute top-4 left-0 pl-3 flex items-start pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="theme"
                    className="block text-sm font-medium mb-2 text-gray-300"
                  >
                    Select Theme
                  </label>
                  <select
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-gray-900/80 text-white p-4 rounded-xl border border-gray-700/50 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  >
                    {Object.keys(themeStyles).map((themeKey) => (
                      <option key={themeKey} value={themeKey}>
                        {themeStyles[themeKey].name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!topic || !theme || isGenerating}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                    isGenerating || !topic || !theme
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-purple-500/20"
                  } flex items-center justify-center`}
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19.044 7.891L13.055 2.9a3 3 0 00-2.12-.88H5.063a3 3 0 00-3 3v14a3 3 0 003 3h13.752a3 3 0 003-3V10.03a3 3 0 00-.88-2.12l-1.891-1.02zM10.015 15.92L7.04 12.935 8.45 11.52l1.565 1.574 4.35-4.35 1.414 1.414-5.764 5.762z"></path>
                      </svg>
                      Generate Presentation
                    </>
                  )}
                </button>
              </div>

              {/* Feature highlights */}
              <div className="mt-12 pt-8 border-t border-gray-800/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">AI-Powered</h3>
                    <p className="text-gray-400 text-sm">
                      Advanced AI generates professional slides in seconds
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                      <svg
                        className="w-6 h-6 text-purple-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Beautifully Designed
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Professional templates and modern designs
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
                      <svg
                        className="w-6 h-6 text-teal-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Time-Saving</h3>
                    <p className="text-gray-400 text-sm">
                      Create complete presentations in minutes, not hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && slides.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                {presentationTitle}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-white transition-all duration-300 flex items-center border border-gray-700/50 ${
                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      Save as PPT
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-gray-700/50 shadow-xl p-6">
              <PresentationPreview slides={slides} initialTheme={theme} />
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Past Presentations
            </h2>

            {pastPresentations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastPresentations.map((presentation) => (
                  <div
                    key={presentation._id} // Use _id from MongoDB
                    className="backdrop-blur-sm bg-white/5 rounded-xl border border-gray-700/50 p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 group"
                    onClick={() => {
                      setSlides(presentation.slides);
                      setPresentationTitle(presentation.title);
                      setTheme(presentation.theme); // Restore the theme
                      setActiveTab("preview");
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-lg group-hover:text-purple-400 transition-colors">
                        {presentation.title}
                      </h3>
                      <span className="text-sm text-gray-400 bg-gray-800/70 py-1 px-2 rounded-full">
                        {new Date(presentation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-300">
                        {presentation.slides.length} slides
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="h-5 w-5 text-purple-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-gray-700/50 p-8 text-center">
                <svg
                  className="w-16 h-16 text-gray-600 mx-auto mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-400">
                  No past presentations found. Generate a presentation to see it
                  here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationBuilder;
