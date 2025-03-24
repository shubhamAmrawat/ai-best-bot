import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import PresentationBuilder from "./PresentationBuilder/PresentationBuilder"; // Import for rendering on the landing page

import "./LandingPage.css";

function LandingPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const avatarLetter = user.username.charAt(0).toUpperCase();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChatbotClick = () => {
    console.log("Navigating to /chatbot");
    navigate("/chatbot");
  };

  const handlePresentationBuilderClick = () => {
    console.log("Navigating to /presentation-builder");
    navigate("/presentation-builder");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative flex flex-col h-screen bg-[#1a1a1a] text-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#1a1aa] border-b border-gray-700 p-2 px-4 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-[#E91E63] font-mono">AIBOT</h1>
        </div>

        {/* User Avatar with Dropdown */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-l from-[#9c66dd] to-[#E91E63] flex items-center justify-center text-white font-bold text-xl cursor-pointer"
            onClick={toggleDropdown}
          >
            {avatarLetter}
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#323232] border border-gray-500 rounded-lg shadow-lg z-30">
              <div className="p-2 text-white text-center border-b border-gray-500">
                {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 text-white hover:bg-[#494747] rounded-b-lg transition"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex main-content flex-col items-center justify-center flex-1 pt-4">
        <h1 className="text-4xl font-bold mb-12">
          Welcome,
          <span className="bg-gradient-to-l from-[#9c66dd] to-[#E91E63] bg-clip-text text-transparent">
            {user.username.charAt(0).toUpperCase() + user.username.slice(1)}!
          </span>
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* CHAT ASSISTANT Option (Includes Tool Builder Functionality) */}
          <div
            onClick={handleChatbotClick}
            className="bg-[#323232] p-6 rounded-lg border border-purple-500 hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl font-semibold mb-4">CHAT ASSISTANT</h2>
            <p className="text-center text-gray-300">
              Chat with an AI assistant for general tasks, internet search, and
              building tools like websites with HTML, CSS, JS, and a sandbox
              preview.
            </p>
          </div>

          {/* PRESENTATION BUILDER Option (Navigates to PresentationBuilder Component) */}
          <div
            onClick={handlePresentationBuilderClick}
            className="bg-[#323232] p-6 rounded-lg border border-blue-500 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl font-semibold mb-4">
              PRESENTATION BUILDER
            </h2>
            <p className="text-center text-gray-300">
              Create stunning presentations with AI assistance.
            </p>
            <span className="mt-4 text-yellow-300 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
