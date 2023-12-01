require("dotenv").config();
const express = require("express");
const router = express.Router();
const { rateLimit } = require("express-rate-limit");
const sanitizeHTML = require("sanitize-html");
const fs = require("fs");
const createError = require("http-errors");
const { spawn } = require("child_process");
const path = require("path");
const moment = require("moment");

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
const {
  checkLogin,
  backupDB,
  createArchivePath,
} = require("../middlewares/utils");
const DB_NAME = "MessageServer";
const DB_DIR = path.join(__dirname, "..", "dbBackups");

// /login route
router
  .route("/login")
  .get(limiter, (req, res) => {
    const curretnUser = req.session.user;
    if (curretnUser) {
      return res.status(201).redirect("/dbaccounts/homepage");
    }
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
    req.session.user = username;
    return res.status(201).redirect("/dbaccounts/homepage");
  });

// homepage route
// db backups usign mongodump command "mongodump --db=MessageServer --archive=MesSer.gzip --gzip";
router
  .route("/homepage")
  .get(limiter, (req, res) => {
    const curretnUser = req.session.user;
    if (!curretnUser) {
      return res.status(301).redirect("/dbaccounts/login");
    }
    let fileList = [];
    fs.readdirSync(DB_DIR).forEach((file) => {
      fileList.push(`${file}`);
    });
    // console.log("File paths in the directory:", fileList);
    return res.status(201).render("dbaccounts/homepage", {
      document: "Homepage",
      style: "homepage",
      fileList: fileList,
      fileListCounter: fileList.length,
      success: req.flash("success") || "",
      error: req.flash("error") || "",
    });
  })
  .post((req, res, next) => {
    const { dbBackupRequest } = req.body;
    if (dbBackupRequest != "dbBackupRequest") {
      next(createError("500", "Error: Data invalid inside Login"));
      // you need to have a return here to prevent multiple return headers
      // web dev simplified middleware have this explanation
      return;
    }
    // create a db backups
    const ARCHIVE_PATH = createArchivePath(DB_NAME);
    backupDB(DB_NAME, ARCHIVE_PATH);
    // console.log(ARCHIVE_PATH);
    req.flash(
      "success",
      `Succefully Created New Back Up at ${moment(new Date()).format("LLLL")}`
    );
    return res.status(201).redirect("/dbaccounts/homepage");
  });

router.route("/logout").post((req, res) => {
  req.session.destroy();
  return res.status(200).redirect("/");
});

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
