function usernameEasterEgg() {
  let original = document.getElementById("usernameHelp").innerHTML;
  let newString = original + " Always.";
  document.getElementById("usernameHelp").innerHTML = newString;
}

function passwordEasterEgg() {
  document.getElementById("password1Help").innerHTML = "Your Password too!";
}
