import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WeeklyScheduler from "./components/Dashboard/WeeklyScheduler";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/HomePage";

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard/:userID" element={<WeeklyScheduler />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
