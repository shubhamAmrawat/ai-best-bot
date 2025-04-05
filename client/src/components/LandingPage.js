import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrainCircuitIcon,
  LogOut,
  MessageCircle,
  MessageCircleIcon,
  Presentation,
  User,
} from "lucide-react";
import { motion } from "framer-motion"; // For animations

import "./LandingPage.css";

function LandingPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const avatarLetter = user.username.charAt(0).toUpperCase();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // State to control the loader

  // Simulate a loading delay (e.g., 2 seconds) or wait for content to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust the delay as needed (2000ms = 2 seconds)

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, []);

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
    <div className="relative flex flex-col h-screen bg-[#0c0c0c] text-white overflow-hidden">
      {/* Loader */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0c0c]"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Enhanced Animated Loader */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              }}
              className="relative w-16 h-16"
            >
              <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
              <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-b-blue-400 animate-spin-reverse" />
              <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-l-pink-500 animate-spin-slow" />
            </motion.div>

            {/* Pulsating Text */}
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: "easeInOut",
              }}
              className="text-lg font-semibold text-purple-300 drop-shadow-md"
            >
              Loading 
              ...
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Main Content (only visible after the loader is done) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col h-screen"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="bg-effect-circle top-[-10%] left-[-10%]"></div>
          <div className="bg-effect-circle bottom-[-15%] right-[-15%]"></div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-20   border-b border-gray-700/50 py-3 px-4 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center">
            <BrainCircuitIcon size={45} color="#E23E57" />
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
                className="absolute right-0 mt-2 w-48 bg-[#0c0c0c]  border border-gray-500/50 rounded-lg shadow-xl z-30"
              >
                <div className="p-3 text-white  border-b border-gray-500/50">
                  <span className="flex gap-1 items-center justify-start text-xl font-semibold ">
                    <User color="white"/ >
                    {user.username.charAt(0).toUpperCase() +
                      user.username.slice(1)}
                  </span>
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
              className="relative bg-[#121212]  p-8 rounded-xl border border-purple-500/30 hover:bg-[#151515] cursor-pointer transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-full  rounded-xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <MessageCircle className="w-12 h-12 text-purple-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  Chat Assistant
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Chat with an AI assistant for general tasks, web searches, and
                  tool creation, including website development with HTML, CSS,
                  and JavaScript
                </p>
              </div>
            </motion.div>

            {/* PRESENTATION BUILDER Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handlePresentationBuilderClick}
              className="relative bg-[#121212]  p-8 rounded-xl border border-purple-500/30 hover:bg-[#151515] cursor-pointer transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-full  rounded-xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <Presentation className="w-12 h-12 text-blue-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                  Presentation Builder
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Effortlessly create visually stunning and engaging
                  presentations with AI assistance.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 p-4 text-center text-gray-400 text-sm">
          <p>©Shubham Amrawat</p>
        </footer>
      </motion.div>
    </div>
  );
}

export default LandingPage;
