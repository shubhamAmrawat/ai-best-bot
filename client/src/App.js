import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LandingPage from "./components/LandingPage";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    return token && username ? { token, username } : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      console.log("Attempting to validate token:", token);
      axios
        .get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("User data from /me:", res.data);
          const updatedUser = { token, username: res.data.username };
          setUser(updatedUser);
          localStorage.setItem("username", updatedUser.username);
        })
        .catch((err) => {
          console.error("Token validation failed:", err.message);
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          setUser(null);
        });
    }
  }, [user]);

  const handleLogin = (userData) => {
    console.log("handleLogin called with:", userData);
    setUser(userData);
    localStorage.setItem("token", userData.token);
    localStorage.setItem("username", userData.username);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentChatId(null);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  };

  return (
    <Router>
      <div className="h-screen bg-[#1a1a1a] text-white">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />}
          />
          <Route
            path="/"
            element={
              user ? (
                <LandingPage user={user} handleLogout={handleLogout} /> // Pass handleLogout
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/chatbot"
            element={
              user ? (
                <div className="flex">
                  <Sidebar
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    setCurrentChatId={setCurrentChatId}
                    currentChatId={currentChatId}
                    handleLogout={handleLogout}
                  />
                  <ChatWindow
                    chatId={currentChatId}
                    setCurrentChatId={setCurrentChatId}
                    isSidebarOpen={isSidebarOpen}
                    user={user}
                  />
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/tool-builder"
            element={
              user ? (
                <div className="flex">
                  <Sidebar
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    setCurrentChatId={setCurrentChatId}
                    currentChatId={currentChatId}
                    handleLogout={handleLogout}
                  />
                  <div className="flex-1 p-4">
                    <h1 className="text-2xl">Tool Builder (Coming Soon)</h1>
                  </div>
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;