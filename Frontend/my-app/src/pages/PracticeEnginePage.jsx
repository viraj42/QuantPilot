import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { startPracticeSession, submitPracticeSession } from "../api/practice.api";
import { 
  TopMinimalBar, 
  QuestionBlock, 
  OptionList, 
  BottomNav,
  SessionResultCard
} from "../components/PracticeComponent";
import Loader from "./Loader";

const PracticeEnginePage = () => {
  const { topicId, level } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [result, setResult] = useState(null);
  const [timeSpent, setTimeSpent] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    const startSession = async () => {
      try {
        const response = await startPracticeSession(topicId, Number(level));
        setSession(response);
        console.log(response);
        
      } catch (err) {
        console.error("Session fail", err);
      } finally {
        setLoading(false);
      }
    };
    startSession();
  }, [topicId, level]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader/></div>;
  if (result) return (
  <SessionResultCard 
    result={result} 
    sessionId={result.sessionId} 
  />
);

  const currentQuestion = session?.questions[currentIndex];
  const totalQuestions = session?.totalQuestions || 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelect = (optionId) => {
    setSelections(prev => ({ ...prev, [currentIndex]: optionId }));
  };

  const handleBookmark = () => {
    setBookmarks(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

const handleSubmit = async () => {
  try {
    const answers = session.questions.map((q, i) => ({
      questionId: q._id,
      selectedOption: selections[i],
      isGuess: false,
      timeTaken: timeSpent[i] || 0
    }));

    const response = await submitPracticeSession(topicId, Number(level), answers);

    // ✅ IMPORTANT: ensure sessionId exists
    setResult({
      ...response,
      sessionId: response.sessionId   // 👈 must come from backend
    });

  } catch (err) {
    console.error(err);
  }
};

  const handleNext = () => {
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    setTimeSpent(prev => ({ ...prev, [currentIndex]: (prev[currentIndex] || 0) + timeTaken }));
    
    if (isLastQuestion) handleSubmit();
    else {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-700">
      <TopMinimalBar 
        topicName={session?.topicName || "Practice"} 
        level={level} 
        current={currentIndex + 1} 
        total={totalQuestions}
        isBookmarked={bookmarks[currentIndex]}
        onBookmark={handleBookmark}
      />

      <main className="max-w-3xl mx-auto px-6">
        <QuestionBlock text={currentQuestion?.text || ""} index={currentIndex + 1} />
        <OptionList 
          options={currentQuestion?.options || []} 
          selectedId={selections[currentIndex]} 
          onSelect={handleSelect} 
        />
      </main>

      {/* Navigation follows strict symmetry and height guidelines */}
      <BottomNav 
        onPrev={handlePrev}
        onNext={handleNext} 
        canNext={selections[currentIndex] !== undefined}
        canPrev={currentIndex > 0}
        isLast={isLastQuestion}
      />
    </div>
  );
};

export default PracticeEnginePage;