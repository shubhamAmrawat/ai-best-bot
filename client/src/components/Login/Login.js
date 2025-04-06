import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Rocket } from "lucide-react"; // Added Rocket
import { GoogleLogin } from "@react-oauth/google"; // Import Google Login component
import './Login.css'
function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!identifier) newErrors.identifier = "Username or email is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        identifier,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      onLogin({ token: res.data.token, username: res.data.username });
    } catch (err) {
      setErrors({ form: err.response?.data?.error || "Login failed" });
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google-login", {
        token: response.credential,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      onLogin({ token: res.data.token, username: res.data.username });
    } catch (err) {
      setErrors({ form: err.response?.data?.error || "Google login failed" });
    }
  };

  const handleGoogleFailure = (error) => {
    console.error("Google Login Failed:", error);
    setErrors({ form: "Google login failed. Please try again." });
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-screen bg-[#0c0c0c] overflow-hidden bg-class bg-overlay">
     

      <form onSubmit={handleLogin} className="relative bg-[#121212] p-8 rounded-xl shadow-2xl w-96 z-10 border border-gray-500">
        <h2 className="text-3xl text-white font-bold mb-6 text-center">Login</h2>
        {errors.form && <p className="text-red-500 mb-4 text-center">{errors.form}</p>}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full p-3 bg-transparent text-white rounded-lg outline-none border border-gray-500 focus:border-blue-500/50 transition"
          />
          {errors.identifier && <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>}
        </div>
        <div className="mb-6">
          <div className="pe-2 flex items-center bg-transparent rounded-lg outline-none border border-gray-500 transition">
            <input
              type={visible ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-transparent outline-none text-white"
            />
            <span onClick={() => setVisible(!visible)} className="cursor-pointer ml-2">
              {visible ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>
        <button
          type="submit"
          className="w-full p-3 bg-gradient-to-r from-green-500 to-purple-300 hover:from-green-600 hover:to-purple-400 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition mb-4"
        >
          <Rocket size={20} />
          Login
        </button>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleFailure}
          render={(renderProps) => (
            <button
              onClick={renderProps.onClick}
              disabled={renderProps.disabled}
              className="w-full p-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2 transition hover:bg-gray-200 mb-4"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Login with Google
            </button>
          )}
        />
        <p className="text-white mt-4 text-center">
          Don’t have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;