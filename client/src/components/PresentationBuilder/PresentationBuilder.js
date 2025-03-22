import React, { useState } from "react";
import axios from "axios";
import PresentationPreview from "./PresentationPreview";

const PresentationBuilder = () => {
  const [topic, setTopic] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [slides, setSlides] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [pastPresentations, setPastPresentations] = useState([]);

  const handleGenerate = async () => {
    if (!topic) return;

    setIsGenerating(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/presentations/generate",
        {
          topic,
          outline: additionalInfo.trim() || undefined,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const result = response.data;
      setSlides(result.slides);
      setPresentationTitle(result.slides[0]?.title || "Untitled Presentation");

      // Save to history
      const newPresentation = {
        id: Date.now().toString(),
        title: result.slides[0]?.title || "Untitled Presentation",
        date: new Date().toLocaleDateString(),
        slides: result.slides,
      };

      setPastPresentations((prev) => [newPresentation, ...prev]);
      setActiveTab("preview");
    } catch (error) {
      console.error("Failed to generate presentation:", error);
      alert("Failed to generate presentation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    alert("Presentation saved successfully!");
  };

  const handleExportToGoogleSlides = () => {
    window.open("https://slides.google.com", "_blank");
  };

  return (
    <div className="space-y-6 p-8 w-full h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-auto">
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-4 py-2 text-lg font-medium ${activeTab === "create"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-gray-200"
            }`}
          onClick={() => setActiveTab("create")}
        >
          Create
        </button>
        <button
          className={`px-4 py-2 text-lg font-medium ${activeTab === "preview"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-gray-200"
            } ${slides.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => slides.length > 0 && setActiveTab("preview")}
          disabled={slides.length === 0}
        >
          Preview
        </button>
        <button
          className={`px-4 py-2 text-lg font-medium ${activeTab === "history"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-gray-200"
            } ${pastPresentations.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => pastPresentations.length > 0 && setActiveTab("history")}
          disabled={pastPresentations.length === 0}
        >
          History
        </button>
      </div>

      {/* Create Tab */}
      {activeTab === "create" && (
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                Presentation Topic
              </label>
              <input
                id="topic"
                placeholder="Enter your presentation topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-gray-900 text-white p-4 rounded-lg border border-gray-600 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="additionalInfo"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                Additional Information (optional)
              </label>
              <textarea
                id="additionalInfo"
                placeholder="Add any specific requirements, number of slides, style preferences, etc."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                className="w-full bg-gray-900 text-white p-4 rounded-lg border border-gray-600 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!topic || isGenerating}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 ${isGenerating || !topic
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/50"
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
                "Generate Presentation"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === "preview" && slides.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-semibold">{presentationTitle}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all duration-300 flex items-center"
              >
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
                Save
              </button>
              <button
                onClick={handleExportToGoogleSlides}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all duration-300 flex items-center"
              >
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open in Google Slides
              </button>
            </div>
          </div>

          <PresentationPreview slides={slides} />
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Past Presentations</h2>

          {pastPresentations.length > 0 ? (
            <div className="space-y-4">
              {pastPresentations.map((presentation) => (
                <div
                  key={presentation.id}
                  className="border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setSlides(presentation.slides);
                    setPresentationTitle(presentation.title);
                    setActiveTab("preview");
                  }}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{presentation.title}</h3>
                    <span className="text-sm text-gray-400">{presentation.date}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    {presentation.slides.length} slides
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300">
              No past presentations found. Generate a presentation to see it here.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PresentationBuilder;