import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PlusCircle,
  LogOut,
  Trash2,
  Home,
  PanelRightOpenIcon,
  PanelRightCloseIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Sidebar({
  user,
  isSidebarOpen,
  setIsSidebarOpen,
  setCurrentChatId,
  currentChatId,
  handleLogout,
}) {
  const [chats, setChats] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  // const themeClr = "bg-[#DA0037]";
  // const hoverClr = "hover:bg-[#f6265a]";
  useEffect(() => {
    fetchChats();
  }, [currentChatId]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token available");
      const res = await axios.get("http://localhost:5000/api/chat/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data);
    } catch (error) {
      console.error("Fetch chats error:", error.message);
    }
  };

  const createNewChat = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token available");
      const res = await axios.post(
        "http://localhost:5000/api/chat/new",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentChatId(res.data._id);
      fetchChats();
    } catch (error) {
      console.error("Create chat error:", error.message);
    }
  };

  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (chatId) => {
    setChatToDelete(chatId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/chat/${chatToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (chatToDelete === currentChatId) {
        setCurrentChatId(null);
      }

      await fetchChats();

      if (chats.length > 1) {
        const newCurrentChatId =
          chats.find((chat) => chat._id !== chatToDelete)?._id || null;
        setCurrentChatId(newCurrentChatId);
      }

      setShowDeleteConfirm(false);
      setChatToDelete(null);
    } catch (error) {
      console.error("Delete chat error:", error.message);
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    }
  };

  const cancelDeleteChat = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const goToLandingPage = () => {
    setCurrentChatId(null);
    navigate("/");
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    handleLogout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div
      className={`fixed h-full bg-gradient from-slate-900 via-indigo-950 to-black  border-r border-gray-700 transition-all duration-500 ease-in-out flex flex-col ${
        isSidebarOpen ? "w-64 p-4" : "w-14 p-2"
      }`}
      style={{ zIndex: 1 }} // Set a low z-index to ensure dialogs can overlay
    >
      {/* Toggle Button */}
      <div
        className={`mt-2 mb-2 flex items-center transition-all duration-500 ease-in-out ${
          isSidebarOpen
            ? "justify-between"
            : "flex-col justify-center items-center"
        }`}
      >
        <div className="relative group">
          <button
            className={`p-2 rounded-full  transition-all duration-300 ease-in-out `}
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <PanelRightOpenIcon size={24} className="text-white" />
            ) : (
              <PanelRightCloseIcon size={24} className="text-white" />
            )}
          </button>
          {!isSidebarOpen && (
            <span className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Toggle Sidebar
            </span>
          )}
        </div>

        <div className="relative group">
          <button
            className={`p-2 rounded-full  transition-all duration-300 ease-in-out  ${
              isSidebarOpen ? "w-10 h-10 mt-0" : "w-10 h-10 mt-2"
            }`}
            onClick={goToLandingPage}
          >
            <Home size={24} className="text-white" />
          </button>
          {!isSidebarOpen && (
            <span className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Home
            </span>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="relative group">
        <button
          className={`mt-4 flex items-center justify-center gap-2 bg-[#DA0037]  font-bold py-2 px-4 transition-all duration-300 ease-in-out transform hover:bg-[#f6265a] ${
            isSidebarOpen
              ? "w-full rounded-lg"
              : "w-10 h-10 flex-col justify-center items-center self-center rounded-[50px]"
          }`}
          onClick={createNewChat}
        >
          <PlusCircle size={isSidebarOpen ? 24 : 22} className="text-white" />
          {isSidebarOpen && (
            <span
              className={`text-white transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0"
              }`}
            >
              New Chat
            </span>
          )}
        </button>
        {!isSidebarOpen && (
          <span className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            New Chat
          </span>
        )}
      </div>

      {/* Chat List */}
      <div
        className={`mt-8 space-y-4 flex-1 overflow-auto transition-opacity duration-500 ease-in-out ${
          isSidebarOpen ? "opacity-100" : "opacity-0 h-0"
        }`}
      >
        {isSidebarOpen &&
          chats.map((chat) => (
            <div
              key={chat._id}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out flex items-center justify-between ${
                currentChatId === chat._id
                  ? "backdrop-blur-sm bg-[#141414]  rounded-2xl    text-white"
                  : "hover:bg-[#171717] text-gray-300"
              }`}
            >
              <span onClick={() => selectChat(chat._id)} className="flex-1">
                {chat.title || `Chat ${chat._id.slice(0, 6)}`}
              </span>
              <button
                onClick={() => handleDeleteChat(chat._id)}
                className="text-red-400 hover:text-red-600 transition-colors duration-200"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center confirmation-modal pointer-events-none">
          <div className="bg-[#2c2c2c] p-6 rounded-lg shadow-lg text-white pointer-events-auto transform transition-all duration-300 scale-100">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteChat}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChat}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center confirmation-modal pointer-events-none">
          <div className="bg-[#2c2c2c] p-6 rounded-lg shadow-lg text-white pointer-events-auto transform transition-all duration-300 scale-100">
            <h3 className="text-lg font-bold mb-4">Confirm Logout</h3>
            <p className="mb-4 text-yellow-300">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="relative group">
        <button
          className={`mt-auto flex items-center justify-center gap-2 bg-[#DA0037] hover:bg-[#f6265a] font-bold py-2 px-4 transition-all duration-300 ease-in-out  ${
            isSidebarOpen
              ? "w-full rounded-lg"
              : "w-10 h-10 flex-col justify-center items-center self-center rounded-[50px]"
          }`}
          onClick={handleLogoutClick}
        >
          <LogOut size={isSidebarOpen ? 24 : 20} className="text-white" />
          {isSidebarOpen && (
            <span
              className={`text-white transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0"
              }`}
            >
              Logout
            </span>
          )}
        </button>
        {!isSidebarOpen && (
          <span className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Logout
          </span>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
