const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const MONGO_URI = "mongodb+srv://virajpadaval42_db_user:fp3gzkHcnbizQCit@cluster0.ud5uxvp.mongodb.net/QuantPilot?retryWrites=true&w=majority&appName=Cluster0";

async function createAdmin() {
  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ email: "virajpadaval@gmail.com" });
  if (existing) {
    console.log("Admin already exists");
    process.exit();
  }

  const hashed = await bcrypt.hash("#Viraj$42", 10);

  await User.create({
    name: "Project Admin",
    email: "virajpadaval@gmail.com",
    passwordHash: hashed,
    role: "admin",
  });

  console.log("Admin created successfully");
  process.exit();
}

createAdmin();