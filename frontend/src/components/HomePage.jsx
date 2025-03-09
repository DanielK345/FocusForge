import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center px-6">
      <h1 className="text-5xl font-extrabold mb-4">FocusForge 🚀</h1>
      <p className="text-lg md:text-xl mb-8 opacity-80">
        "Master Your Time, Unlock Your Productivity."
      </p>
      <div className="flex space-x-4">
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </button>
        <button
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition"
          onClick={() => navigate("/login")}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default Home;
