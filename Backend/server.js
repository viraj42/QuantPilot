const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
  const app = express();
const cors =require("cors");
const authRoutes = require("./routes/auth.routes");
const sectionRoute=require("./routes/section.routes");
const topicRoute=require("./routes/topic.routes");
const practiceRoute=require("./routes/practice.routes");
const sessionRoutes = require("./routes/session.routes");
const profileRoutes = require("./routes/analytics.routes");
const mockRoutes = require("./routes/mock.routes");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));


app.use(express.json());
app.use(cors());
app.use("/api/analytics", profileRoutes);
app.use("/api/review", sessionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/syllabus",sectionRoute);
app.use("/api/syllabus",topicRoute);
app.use("/api/session",practiceRoute);
app.use("/api/mock", mockRoutes);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
