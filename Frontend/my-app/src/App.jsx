import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/ThemeContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import PracticeHome from "./pages/practiceHome";
import SectionTopicsPage from "./pages/SectionTopicsPage";
import LevelRoadmapPage from "./pages/LevelRoadMapPage";
import PracticeEnginePage from "./pages/PracticeEnginePage";
import PracticeReviewPage from "./pages/PracticeReviewPage";


function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<PracticeHome />} />
          <Route path="/practice/:sectionId" element={<SectionTopicsPage />} />
          <Route path="/practice/:sectionId/:topicId" element={<LevelRoadmapPage />} />
          <Route path="/practice/:sectionId/:topicId/level/:level" element={<PracticeEnginePage />}/>
          <Route path="/practice/:sessionId/review" element={<PracticeReviewPage />}/>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;