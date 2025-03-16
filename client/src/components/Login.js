import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Eye, EyeOffIcon, Rocket } from 'lucide-react';

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState(''); // Changed to identifier
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!identifier) newErrors.identifier = 'Username or email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { identifier, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      onLogin({ token: res.data.token, username: res.data.username });
    } catch (err) {
      setErrors({ form: err.response?.data?.error || 'Login failed' });
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-screen bg-[#1e1e1e] overflow-hidden">
      {/* Background SVG Decorations */}
      <svg
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

      {/* Login Form */}
      <form onSubmit={handleLogin} className="relative bg-[#323232] p-8 rounded-xl shadow-2xl w-96 z-10 border border-gray-500">
        <h2 className="text-3xl text-white font-bold mb-6 text-center">Login</h2>
        {errors.form && <p className="text-red-500 mb-4 text-center">{errors.form}</p>}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full p-3 bg-[#1e1e1e] text-white rounded-lg outline-none border border-gray-500 focus:border-blue-500 transition"
          />
          {errors.identifier && <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>}
        </div>
        <div className="mb-6 pe-2 flex items-center bg-[#1e1e1e] rounded-lg outline-none border border-gray-500  transition ">
          <input
            type={visible ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-transparent outline-none text-white  "
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          <span onClick={() => setVisible(!visible)} className='cursor-pointer '>
            {
              visible? (
                <EyeOffIcon size={20} />
              ) : (
                  <Eye size={20} />
              )
            }
  
          </span>
        </div>
        <button
          type="submit"
          className="w-full p-3 bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Rocket size={20} />
          Login
        </button>
        <p className="text-white mt-4 text-center">
          Don’t have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;