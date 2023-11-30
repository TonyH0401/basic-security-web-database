require("dotenv").config();
const express = require("express");
const router = express.Router();
const { rateLimit } = require("express-rate-limit");
const sanitizeHTML = require("sanitize-html");
const fs = require("fs");
const createError = require("http-errors");
const { spawn } = require("child_process");
const path = require("path");

// .env
const envUsername = process.env.ROOT || "";
const envPassword = process.env.ROOTPASSWORD || "";

// custom funtions and configurations
const limiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 500, // Limit each IP to 21 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: `<div style="width:100vh; padding: 1rem; background-color: red; font-size: 32px; font-weight: 700; 
      text-align: center; margin: 0 auto"> 
        <h3 style="color: white">You are suspended for sending too many requests!</h3>
      </div> `,
});
const { checkLogin } = require("../middlewares/utils");

// /login route
router
  .route("/login")
  .get(limiter, (req, res) => {
    return res.status(201).render("dbaccounts/login", {
      document: "Login Database",
      style: "login",
      error: req.flash("error") || "",
    });
  })
  .post((req, res) => {
    const { username, password1 } = req.body;
    let accountIsCorrect = checkLogin(
      username,
      password1,
      envUsername,
      envPassword
    );
    if (!accountIsCorrect.success) {
      req.flash("error", accountIsCorrect.message);
      return res.status(301).redirect("/dbaccounts/login");
    }
    return res.status(201).redirect("/dbaccounts/homepage");
  });

// homepage route
const DB_NAME = "MessageServer";
const ARCHIVE_PATH = path.join(__dirname, "..", "dbBackups", `${DB_NAME}.gzip`);
const cmd = "mongodump --db=MessageServer --archive=MesSer.gzip --gzip";
router
  .route("/homepage")
  .get(limiter, (req, res) => {
    // console.log(ARCHIVE_PATH);

    const child = spawn("mongodump", [
      `--db=${DB_NAME}`,
      `--archive=${ARCHIVE_PATH}`,
      `--gzip`,
    ]);

    child.stdout.on("data", (data) => {
      console.log("stdout:\n", data);
    });
    child.stderr.on("data", (data) => {
      console.log("stderr:\n", Buffer.from(data).toString());
    });
    child.on("error", (error) => {
      console.log("error:\n", error);
    });
    child.on("exit", (code, signal) => {
      if (code) {
        console.log("Process exit with code: ", code);
      } else if (signal) {
        console.log("Process killed with signal: ", signal);
      } else {
        console.log("Back up is successful!");
      }
    });

    return res.status(201).render("dbaccounts/homepage", {
      document: "Homepage",
      style: "style",
    });
  })
  .post((req, res) => {});

// /dbaccounts error handling
router
  .use((req, res, next) => {
    next(createError("500", "Error inside Login"));
  })
  .use((err, req, res, next) => {
    return res.status(500).render("errors/404Login", {
      document: "404 Login",
      message: err.message,
    });
  });

module.exports = router;
