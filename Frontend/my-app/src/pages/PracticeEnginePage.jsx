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

const PracticeEnginePage = () => {

  const { topicId, level } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [selections, setSelections] = useState({});
  const [bookmarks, setBookmarks] = useState({});

  const [result, setResult] = useState(null);

  // Timing states
  const [timeSpent, setTimeSpent] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Guess state
  const [guesses, setGuesses] = useState({});


  // =========================
  // Start Practice Session
  // =========================
  useEffect(() => {

    const startSession = async () => {

      try {

        const response = await startPracticeSession(topicId, Number(level));

        setSession(response);

      } catch (err) {

        console.error("Practice session start failed:", err);

      } finally {

        setLoading(false);

      }
    };

    startSession();

  }, [topicId, level]);


  // =========================
  // Track Question Start Time
  // =========================
  useEffect(() => {

    setQuestionStartTime(Date.now());

  }, [currentIndex]);


  // =========================
  // Loading State
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-0.5 bg-primary/20 rounded-full overflow-hidden">
          <div className="w-full h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }


  // =========================
  // After Submit Show Result
  // =========================
  if (result) {

    return (
      <SessionResultCard result={result} />
    );

  }


  const currentQuestion = session?.questions[currentIndex];
  const totalQuestions = session?.totalQuestions || 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;


  // =========================
  // Select Option
  // =========================
  const handleSelect = (optionId) => {

    setSelections(prev => ({
      ...prev,
      [currentIndex]: optionId
    }));

  };


  // =========================
  // Bookmark Toggle
  // =========================
  const handleBookmark = () => {

    setBookmarks(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));

  };


  // =========================
  // Guess Toggle
  // =========================
  const handleGuessToggle = () => {

    setGuesses(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));

  };


  // =========================
  // Build Answer Payload
  // =========================
  const buildAnswersPayload = () => {

    return session.questions.map((question, index) => ({

      questionId: question._id,

      selectedOption: selections[index],

      isGuess: guesses[index] || false,

      timeTaken: timeSpent[index] || 0

    }));

  };


  // =========================
  // Submit Practice Session
  // =========================
  const handleSubmit = async () => {

    try {

      const answers = buildAnswersPayload();

      const response = await submitPracticeSession(
        topicId,
        Number(level),
        answers
      );

      setResult(response);

    } catch (err) {

      console.error("Session submit failed:", err);

    }

  };


  // =========================
  // Next Button Logic
  // =========================
  const handleNext = () => {

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    setTimeSpent(prev => ({
      ...prev,
      [currentIndex]: timeTaken
    }));

    if (isLastQuestion) {

      handleSubmit();

    } else {

      setCurrentIndex(prev => prev + 1);

      window.scrollTo(0, 0);

    }

  };


  return (

    <div className="min-h-screen bg-background transition-colors duration-700">

      {/* Top Bar */}

      <TopMinimalBar 
        topicName={session?.topicName || "Topic"} 
        level={level} 
        current={currentIndex + 1} 
        total={totalQuestions} 
      />

      <main className="max-w-3xl mx-auto px-6">

        {/* Question */}

        <QuestionBlock 
          text={currentQuestion?.text || "Question content loading..."} 
          index={currentIndex + 1} 
        />


        {/* Options */}

        <OptionList 
          options={currentQuestion?.options || []} 
          selectedId={selections[currentIndex]} 
          onSelect={handleSelect} 
        />


        {/* Guess Control */}

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest font-bold text-foreground/40  pb-34">

          <button
            onClick={handleGuessToggle}
            className={`flex items-center gap-2 transition ${
              guesses[currentIndex]
                ? "text-primary"
                : "hover:text-foreground"
            }`}
          >
            <span>{guesses[currentIndex] ? "◉" : "○"}</span>

            {guesses[currentIndex]
              ? "Marked as Guess"
              : "Mark Answer as Guess"}
          </button>

        </div>

      </main>


      {/* Bottom Navigation */}

      <BottomNav 
        isBookmarked={bookmarks[currentIndex]} 
        onBookmark={handleBookmark} 
        onNext={handleNext} 
        canNext={selections[currentIndex] !== undefined}
        isLast={isLastQuestion}
      />

    </div>

  );

};

export default PracticeEnginePage;