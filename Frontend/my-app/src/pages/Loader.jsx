import React from "react";
import "../components/Loader.css";

const Loader = () => {
  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="arc arc-blue"></div>
        <div className="arc arc-red"></div>
        <div className="arc arc-yellow"></div>
      </div>
    </div>
  );
};

export default Loader;
