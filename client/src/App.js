import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setUser({ token, username });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setCurrentChatId(null);
  };

  return (
    <Router>
      <div className="app flex h-screen bg-[#1e1e1e] text-white">
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
          />
          <Route
            path="/signup"
            element={!user ? <Signup setUser={setUser} /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={
              user ? (
                <>
                  <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    setCurrentChatId={setCurrentChatId}
                    currentChatId={currentChatId}
                    onLogout={handleLogout} // Pass onLogout to Sidebar
                  />
                  <ChatWindow
                    chatId={currentChatId}
                    setCurrentChatId={setCurrentChatId}
                    isSidebarOpen={isSidebarOpen}
                    user={user}
                  />
                </>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;