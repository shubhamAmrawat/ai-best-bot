import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, MessageCircle, Presentation } from "lucide-react";
import { motion } from "framer-motion"; // For animations

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
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-[#0f0c29] via-[#1a1a3a] to-[#24243e] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="bg-effect-circle top-[-10%] left-[-10%]"></div>
        <div className="bg-effect-circle bottom-[-15%] right-[-15%]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#1a1a3a]/80 backdrop-blur-md border-b border-gray-700/50 p-4 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9c66dd] to-[#E91E63] font-mono"
          >
            AIBOT
          </motion.h1>
        </div>

        {/* User Avatar with Dropdown */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-gradient-to-l from-[#9c66dd] to-[#E91E63] flex items-center justify-center text-white font-bold text-xl cursor-pointer shadow-lg"
            onClick={toggleDropdown}
          >
            {avatarLetter}
          </motion.div>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-[#323232]/90 backdrop-blur-md border border-gray-500/50 rounded-lg shadow-xl z-30"
            >
              <div className="p-3 text-white text-center border-b border-gray-500/50">
                {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 p-3 text-white hover:bg-[#494747]/80 rounded-b-lg transition-all duration-300"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex main-content flex-col items-center justify-center flex-1 pt-8 px-4 z-10">
        {/* Welcome Section */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl md:text-6xl font-extrabold mb-12 text-center leading-tight"
        >
          Welcome,{" "}
          <span className="bg-gradient-to-r from-[#9c66dd] to-[#E91E63] bg-clip-text text-transparent">
            {user.username.charAt(0).toUpperCase() + user.username.slice(1)}!
          </span>
        </motion.h1>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* CHAT ASSISTANT Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleChatbotClick}
            className="relative bg-[#2a2a4a]/80 backdrop-blur-lg p-8 rounded-xl border border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/50 hover:to-blue-600/50 cursor-pointer transition-all duration-500"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <MessageCircle className="w-12 h-12 text-purple-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Chat Assistant
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Chat with an AI assistant for general tasks, web searches, and tool creation, including website development with HTML, CSS, and JavaScript
              </p>
            </div>
          </motion.div>

          {/* PRESENTATION BUILDER Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handlePresentationBuilderClick}
            className="relative bg-[#2a2a4a]/80 backdrop-blur-lg p-8 rounded-xl border border-blue-500/30 hover:bg-gradient-to-br hover:from-blue-600/50 hover:to-indigo-600/50 cursor-pointer transition-all duration-500"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <Presentation className="w-12 h-12 text-blue-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Presentation Builder
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Effortlessly create visually stunning and engaging presentations with AI assistance. 
              </p>
            
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-gray-400 text-sm">
        <p>©Shubham Amrawat</p>
      </footer>
    </div>
  );
}

export default LandingPage;