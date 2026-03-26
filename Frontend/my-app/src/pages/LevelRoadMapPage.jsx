import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLevelRoadmap, startPracticeSession } from '../api/practice.api';
import { TopicHeader, LevelNode, RoadmapConnector } from '../components/LevelComponent';
import { SectionProgressStrip } from '../components/TopicPageComponent';
import Navbar from '../components/Navbar';
import Background3D from '../components/Background3D';

const LevelRoadmapPage = () => {

  const { sectionId, topicId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchRoadmap = async () => {

      try {

        const response = await getLevelRoadmap(topicId);

        // status normalization
        const normalizedLevels = response.levels.map(lvl => {

          let status = "start";

          if (lvl.attempts > 0) {
            status = "practice";
          }

          return {
            ...lvl,
            status
          };

        });

        setData({
          ...response,
          levels: normalizedLevels
        });

      } catch (err) {

        console.error("Roadmap Sync Error:", err);

      } finally {

        setLoading(false);

      }

    };

    fetchRoadmap();

  }, [topicId]);


  const handleStartSession = async (level) => {

    try {

      await startPracticeSession(topicId, level);

      navigate(`/practice/${sectionId}/${topicId}/level/${level}`);

    } catch (err) {

      console.error("Session start failed:", err);

    }

  };


  if (loading) return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      <Background3D />
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-1 bg-primary animate-pulse rounded-full" />
      </div>
    </div>
  );


  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">

      <Background3D />
      <Navbar />

      <main className="relative z-10 min-h-screen bg-background text-foreground pt-16 pb-20 px-6 transition-colors duration-500">

        <div className="max-w-3xl mx-auto">

          {/* Topic Header */}
          <TopicHeader
            name={data.topic.name}
          />
            <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.2em]">
              Maintain accuracy to unlock advanced levels
            </p>
          {/* Same Progress Strip used in section page */}
          <SectionProgressStrip progressPercent={data.topic.overallProgress} />
          
          {/* Roadmap */}
          <div className="flex flex-col items-center">

            {data.levels.map((levelData, index) => (

              <React.Fragment key={levelData.level}>

                <LevelNode
                  data={levelData}
                  onStart={handleStartSession}
                />

                {index < data.levels.length - 1 && (
                  <RoadmapConnector active={levelData.completed} />
                )}

              </React.Fragment>

            ))}

          </div>

        </div>

      </main>

    </div>
  );
};

export default LevelRoadmapPage;