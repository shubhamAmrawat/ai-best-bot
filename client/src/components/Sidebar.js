import React, { useState, useEffect } from "react";
import axios from "axios";
import { Menu, PlusCircle, LogOut } from "lucide-react";

function Sidebar({ isOpen, toggleSidebar, setCurrentChatId, currentChatId, onLogout }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    fetchChats();
  }, [currentChatId]);

  const fetchChats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/chat/history", {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setChats(res.data);
    } catch (error) {
      console.error('Fetch chats error:', error.message);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/chat/new", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCurrentChatId(res.data._id);
    } catch (error) {
      console.error('Create chat error:', error.message);
    }
  };

  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  return (
    <div
      className={`fixed h-full bg-[#1e1e1e] border-r border-gray-500 transition-all duration-300 flex flex-col ${isOpen ? "w-64 p-4" : "w-16 p-2"}`}
    >
      {/* Toggle Button */}
      <button
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition self-start"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      {/* New Chat Button */}
      <button
        className={`mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-purple-500 font-bold py-2 px-4 rounded-lg transition ${isOpen ? "w-full" : "w-12 h-12 p-2"}`}
        onClick={createNewChat}
      >
        <PlusCircle size={isOpen ? 24 : 28} />
        {isOpen && <span>New Chat</span>}
      </button>

      {/* Chat List */}
      {isOpen && (
        <div className="mt-8 space-y-4 flex-1 overflow-auto">
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => selectChat(chat._id)}
              className="p-3 bg-[#3d3c3c] hover:bg-[#494747] rounded-lg cursor-pointer transition"
            >
              {chat.title}
            </div>
          ))}
        </div>
      )}

      {/* Logout Button */}
      <button
        className={`mt-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-purple-500 font-bold py-2 px-4 rounded-lg transition ${isOpen ? "w-full" : "w-12 h-12 p-1"}`}
        onClick={onLogout}
      >
        <LogOut size={isOpen ? 24 : 38} />
        {isOpen && <span>Logout</span>}
      </button>
    </div>
  );
}

export default Sidebar;