const moment = require("moment");
const path = require("path");
const { spawn } = require("child_process");

module.exports.checkLogin = (username, password, envUsername, envPassword) => {
  let data = {
    success: true,
    message: "Valid",
  };
  if (username != envUsername) {
    console.log("invalid username");
    data = {
      success: false,
      message: "Invalid username",
    };
  }
  if (password != envPassword) {
    console.log("invalid password");
    data = {
      success: false,
      message: "Invalid password",
    };
  }
  return data;
};

module.exports.createArchivePath = (DB_NAME) => {
  let currentDate = moment(new Date()).format("YYYY-MM-DD_HH-mm-ss");
  let result = path.join(
    __dirname,
    "..",
    "dbBackups",
    `${DB_NAME + "_" + currentDate}.gzip`
  );
  return result;
};

module.exports.backupDB = (DB_NAME, ARCHIVE_PATH) => {
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
};
