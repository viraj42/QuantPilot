import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/ThemeContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PracticeHome from "./pages/practiceHome";
import SectionTopicsPage from "./pages/SectionTopicsPage";
import LevelRoadmapPage from "./pages/LevelRoadMapPage";
import PracticeEnginePage from "./pages/PracticeEnginePage";
import PracticeReviewPage from "./pages/PracticeReviewPage";
import ProtectedRoute from "./utils/ProtectedRoute";
import MockHome from "./pages/MockHome";
import MockExam from "./pages/MockExam";
import MockResult from "./pages/MockResult";
import ProfileDashboard from "./pages/ProfileDashboard";
import PublicRoute from "./utils/PublicRoute";
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC ROUTES (redirect if logged in) */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* PROTECTED ROUTES */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<PracticeHome />} />
            <Route path="/practice/:sectionId" element={<SectionTopicsPage />} />
            <Route path="/practice/:sectionId/:topicId" element={<LevelRoadmapPage />} />
            <Route path="/practice/:sectionId/:topicId/level/:level" element={<PracticeEnginePage />} />
            <Route path="/practice/:sessionId/review" element={<PracticeReviewPage />} />
            <Route path="/mock/home" element={<MockHome />} />
            <Route path="/mock/:id" element={<MockExam />} />
            <Route path="mock/:id/result" element={<MockResult />} />
            <Route path="/profile" element={<ProfileDashboard />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;