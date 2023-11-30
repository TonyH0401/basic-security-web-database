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
