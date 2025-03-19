import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import './LandinPage.css'

function LandingPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const avatarLetter = user.username.charAt(0).toUpperCase();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChatbotClick = () => {
    console.log("Navigating to /chatbot");
    navigate("/chatbot");
  };

  const handleToolBuilderClick = () => {
    console.log("Navigating to /tool-builder");
    navigate("/tool-builder");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative flex flex-col h-screen bg-[#1a1a1a] text-white overflow-hidden">
      {/* Background SVGs */}
      {/* <svg
        className="absolute top-0 left-0 w-1/3 opacity-10"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0ZM100 180C55.8172 180 20 144.183 20 100C20 55.8172 55.8172 20 100 20C144.183 20 180 55.8172 180 100C180 144.183 144.183 180 100 180Z"
          fill="url(#gradient)"
        />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <svg
        className="absolute bottom-0 right-0 w-1/4 opacity-10"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200ZM100 20C144.183 20 180 55.8172 180 100C180 144.183 144.183 180 100 180C55.8172 180 20 144.183 20 100C20 55.8172 55.8172 20 100 20Z"
          fill="url(#gradient2)"
        />
        <defs>
          <linearGradient id="gradient2" x1="200" y1="0" x2="0" y2="200">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      */}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#1a1aa]  border-b border-gray-700 p-4 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
            AI-BOT
          </h1>
        </div>

        {/* User Avatar with Dropdown */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl cursor-pointer"
            onClick={toggleDropdown}
          >
            {avatarLetter}
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#323232] border border-gray-500 rounded-lg shadow-lg z-30">
              <div className="p-2 text-white text-center border-b border-gray-500">
                {user.username}
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
        <h1 className="text-4xl font-bold mb-12">Welcome, {user.username}!</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* CHATBOT Option */}
          <div
            onClick={handleChatbotClick}
            className="bg-[#323232] p-6 rounded-lg border border-purple-500 hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl font-semibold mb-4">CHATBOT</h2>
            <p className="text-center text-gray-300">
              Chat with an AI assistant for general tasks and internet search.
            </p>
          </div>

          {/* TOOL BUILDER Option */}
          <div
            onClick={handleToolBuilderClick}
            className="bg-[#323232] p-6 rounded-lg border border-blue-500 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl font-semibold mb-4">TOOL BUILDER</h2>
            <p className="text-center text-gray-300">
              Build websites with HTML, CSS, JS, and preview them in a sandbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;