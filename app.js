require("dotenv").config();
const express = require("express");
const createError = require("http-errors");
const path = require("path");
const morgan = require("morgan");

// .env
const port = process.env.PORT || 4040;

// init app
const app = express();

// app.use
app.use(express.json());
app.use(morgan("dev"));

// default route
app.get("/", (req, res) => {
  return res.status(201).json({
    success: true,
  });
});

// error handling
app.use((req, res, next) => {
  next(createError(404, "This directory does not exist!"));
});
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  return res.status(err.status).json({
    code: 0,
    success: false,
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`> Database website running at: http://localhost:${port}`);
});
