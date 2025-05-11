import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
    const apiurl = API.baseURL + API.endpoints.auth.login;
    
    try {
      console.log("Sending login request to:", apiurl);
      const response = await fetch(apiurl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    
      const data = await response.json();
      
      console.log("Login response:", data);

      
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userID", data.userID);
    
        alert("Login successful!");
        navigate(`/dashboard/${data.userID}`);
      } else {
         // Kiểm tra cụ thể lỗi "active session" từ backend
         if (response.status === 400 && data.error && data.error.includes("active session")) {
          console.log("Active sessions detected:", data.activeSessions);
          setErrorMessage(`Bạn đã có ${data.activeSessions} phiên đang hoạt động. Vui lòng đăng xuất khỏi thiết bị khác trước khi tiếp tục.`);
        } else {
          setErrorMessage(data.error || "Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back! 👋</h2>
        
        {errorMessage && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition py-3 rounded-lg font-semibold text-white`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 opacity-70">
          Don't have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
