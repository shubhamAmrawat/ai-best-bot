import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

function Signup({ onLogin }) { // Changed setUser to onLogin
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!username || username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)) {
      newErrors.password = 'Password must be 8+ characters with uppercase, lowercase, number, and special character';
    }
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords must match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', { username, email, password });
      const userData = { token: res.data.token, username: res.data.username };
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      onLogin(userData); // Call onLogin instead of redirecting to /login
      setSignupSuccess(true);
    } catch (err) {
      setErrors({ form: err.response?.data?.error || 'Signup failed' });
    }
  };

  // Redirect to landing page after signup success
  useEffect(() => {
    if (signupSuccess) {
      const timer = setTimeout(() => {
        navigate('/'); // Redirect to landing page instead of /login
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [signupSuccess, navigate]);

  return (
    <div className="relative flex items-center justify-center h-screen w-screen bg-[#1e1e1e] overflow-hidden">
      {/* Lock SVG (Top-Left) */}
      <svg
        className="absolute top-10 left-10 w-1/4 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="30" y="40" width="40" height="40" rx="5" fill="url(#gradient)" />
        <path
          d="M40 40V30C40 20 50 20 50 20C50 20 60 20 60 30V40"
          stroke="url(#gradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Door SVG (Bottom-Right) */}
      <svg
        className="absolute bottom-10 right-10 w-1/3 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="20" y="10" width="60" height="80" rx="5" fill="url(#gradient2)" />
        <circle cx="70" cy="50" r="5" fill="#1e1e1e" />
        <path
          d="M50 10V90"
          stroke="#1e1e1e"
          strokeWidth="2"
          strokeDasharray="4"
        />
        <defs>
          <linearGradient id="gradient2" x1="20" y1="10" x2="80" y2="90">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>

      {/* Signup Form or Success Message */}
      <div className="relative bg-[#323232] p-8 rounded-xl shadow-2xl w-96 z-10 border border-gray-500">
        {signupSuccess ? (
          <div className="text-center">
            <h2 className="text-3xl text-white font-bold mb-6">Signed up Successfully!</h2>
            <p className="text-white">Redirecting to dashboard in 2 seconds...</p>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <h2 className="text-3xl text-white font-bold mb-6 text-center">Sign Up</h2>
            {errors.form && <p className="text-red-500 mb-4 text-center">{errors.form}</p>}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-[#1e1e1e] text-white rounded-lg outline-none border border-gray-500 focus:border-blue-500 transition"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#1e1e1e] text-white rounded-lg outline-none border border-gray-500 focus:border-blue-500 transition"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#1e1e1e] text-white rounded-lg outline-none border border-gray-500 focus:border-purple-500 transition"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <div className="mb-6">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-[#1e1e1e] text-white rounded-lg outline-none border border-gray-500 focus:border-purple-500 transition"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
            >
              <UserPlus size={20} />
              Sign Up
            </button>
            <p className="text-white mt-4 text-center">
              Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default Signup;