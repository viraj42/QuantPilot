import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSectionTopics } from '../api/practice.api';
import { Breadcrumb, SectionProgressStrip, TopicCard } from '../components/TopicPageComponent';
import { motion } from "framer-motion";
import Navbar from '../components/Navbar';
import Background3D from '../components/Background3D';

const SectionTopicsPage = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({
    topics: [],
    sectionName: "",
    progress: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchTopics = async () => {

      try {

        const response = await getSectionTopics(sectionId);
        console.log(response);

        const topics = response.topics || [];

        // ✅ Correct section progress calculation
        const sectionProgress =
          topics.length > 0
            ? Math.round(
                topics.reduce((sum, t) => sum + (t.overall || 0), 0) /
                topics.length
              )
            : 0;

        setData({
          topics,
          sectionName: response.sectionName || "Quantitative Aptitude",
          progress: sectionProgress
        });

      } catch (err) {

        console.error("Failed to load topics:", err);

      } finally {

        setLoading(false);

      }

    };

    fetchTopics();

  }, [sectionId]);

  const handleTopicNavigation = (topic) => {
    navigate(`/practice/${sectionId}/${topic.topicId}`);
  };

  if (loading) return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      <Background3D />
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-1 bg-primary animate-pulse rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      <Background3D />
      <Navbar />

      <main className="relative z-10 min-h-screen bg-background text-foreground pt-15 pb-20 px-6 lg:px-8 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">

          {/* Breadcrumb */}
          <Breadcrumb sectionName={data.sectionName} />

          {/* Section Header */}
          <header className="mb-2">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tighter">
              {data.sectionName}{" "}
              <span className="text-foreground/20 font-medium italic">Topics</span>
            </h1>
          </header>

          {/* Section Progress */}
          <SectionProgressStrip progressPercent={data.progress} />

          {/* Topic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.topics.map((topic, index) => (
              <motion.div
                key={topic.topicId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleTopicNavigation(topic)}
              >
                <TopicCard topic={topic} sectionSlug={sectionId} />
              </motion.div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default SectionTopicsPage;