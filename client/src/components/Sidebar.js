import React, { useState, useEffect } from "react";
import axios from "axios";
import { Menu, PlusCircle, LogOut, Trash2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing

function Sidebar({ user, isSidebarOpen, setIsSidebarOpen, setCurrentChatId, currentChatId, handleLogout }) {
  const [chats, setChats] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const navigate = useNavigate(); // Initialize navigate for routing

  useEffect(() => {
    fetchChats();
  }, [currentChatId]); // Re-fetch when currentChatId changes

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
      fetchChats(); // Refresh chat list
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

      // Update the current chat if the deleted chat was selected
      if (chatToDelete === currentChatId) {
        setCurrentChatId(null); // Deselect the deleted chat
      }

      // Refresh the chat list
      await fetchChats();

      // If there are remaining chats, select the first one
      if (chats.length > 1) {
        const newCurrentChatId = chats.find((chat) => chat._id !== chatToDelete)?._id || null;
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
    // Clear current chat and navigate to landing page
    setCurrentChatId(null);
    navigate("/"); // Adjust the path to your landing page route
    // Optionally clear localStorage if logout is intended
    // localStorage.clear();
  };

  return (
    <div
      className={`fixed h-full bg-[#1e1e1e] border-r border-gray-500 transition-all duration-300 flex flex-col ${
        isSidebarOpen ? "w-64 p-4" : "w-16 p-2"
      }`}
    >
      {/* Toggle Button */}

      <div
        className={`mt-2 mb-2 flex items-center  ${
          isSidebarOpen
            ? "justify-between"
            : "flex-col justify-center items-center"
        } transition-all duration-300 ease-in-out`}
      >
        <button
          className="p-2 rounded-full bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 transition-all duration-300 ease-in-out transform hover:scale-110 "
          onClick={toggleSidebar}
        >
          <Menu size={24} className="text-white" />
        </button>

        {/* Home Icon */}
        <button
          className={`p-2 rounded-full bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 transition-all duration-300 ease-in-out transform hover:scale-110 ${
            isSidebarOpen ? "w-10 h-10 mt-0" : "w-10 h-10 mt-2"
          }`}
          onClick={goToLandingPage}
        >
          <Home size={24} className="text-white" />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        className={`mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-purple-500 font-bold py-2 px-4 rounded-lg transition ${
          isSidebarOpen ? "w-full" : "w-12 h-12 p-2"
        }`}
        onClick={createNewChat}
      >
        <PlusCircle size={isSidebarOpen ? 24 : 28} />
        {isSidebarOpen && <span>New Chat</span>}
      </button>

      {/* Chat List */}
      {isSidebarOpen && (
        <div className="mt-8 space-y-4 flex-1 overflow-auto">
          {chats.map((chat) => (
            <div
              key={chat._id}
              className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between ${
                currentChatId === chat._id
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-[#3d3c3c] hover:bg-[#494747] text-gray-300"
              }`}
            >
              <span onClick={() => selectChat(chat._id)} className="flex-1">
                {chat.title || `Chat ${chat._id.slice(0, 6)}`}
              </span>
              <button
                onClick={() => handleDeleteChat(chat._id)}
                className="text-red-400 hover:text-red-600 ml-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="bg-[#2c2c2c] p-6 rounded-lg shadow-lg text-white pointer-events-auto">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteChat}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChat}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        className={`mt-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-purple-500 font-bold py-2 px-4 rounded-lg transition ${
          isSidebarOpen ? "w-full" : "w-12 h-12 p-1"
        }`}
        onClick={handleLogout}
      >
        <LogOut size={isSidebarOpen ? 24 : 38} />
        {isSidebarOpen && <span>Logout</span>}
      </button>
    </div>
  );
}

export default Sidebar;