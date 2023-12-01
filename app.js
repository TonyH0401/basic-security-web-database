require("dotenv").config();
const express = require("express");
const createError = require("http-errors");
const path = require("path");
const morgan = require("morgan");
const exphbs = require("express-handlebars");
const { rateLimit } = require("express-rate-limit");
const session = require("express-session");
const flash = require("connect-flash");

// .env
const port = process.env.PORT || 4040;
const sessionSecret = process.env.SESSIONSECRET || "haha";

// init app
const app = express();

// view engine
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
  })
);
app.set("view engine", ".hbs");
app.set("views", "./views");

// app.use
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: sessionSecret,
    // cookie: { maxAge: 10 * 60 * 1000 },
    cookie: { maxAge: 20 * 1000 },
    saveUninitialized: false,
    resave: false,
  })
);
app.use(flash());

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

// default route
app.get("/", limiter, (req, res) => {
  const curretnUser = req.session.user;
  if (curretnUser) {
    return res.status(201).redirect("/dbaccounts/homepage");
  }
  return res.status(200).redirect("/dbaccounts/login");
});

// other routes
const DBAccountRouter = require("./routers/DBAccountRouter");
app.use("/dbaccounts", DBAccountRouter);

// error handling
app.use((req, res, next) => {
  next(createError(404, "This directory does not exist!"));
});
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  return res.status(404).render("errors/404", {
    document: "404",
    style: "style",
    message: err.message,
  });
});

// initialize server
app.listen(port, () => {
  console.log(`> Database website running at: http://localhost:${port}`);
});
