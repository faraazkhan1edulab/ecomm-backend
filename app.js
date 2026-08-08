const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const authRoutes = require('./routes/auth.routes');
const path = require('path');

app.use("/api/auth", authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;