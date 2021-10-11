const express = require("express");
const socket = require("socket.io");
const path = require("path");
const http = require("http");
const ejs = require("ejs");
const cors = require("cors");

// PORT setup
const PORT = 5000;

//CORS
const allowlist = ["http://localhost:5000"];
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

// SERVER CONFIG'S
const app = express();

app.use(cors(corsOptionsDelegate));
app.use(express.json());

const server = http.Server(app);

const clientPath = path.join(__dirname, "../client");

app.set("view engine", "ejs");
app.set("views", clientPath);
app.use("/client", express.static(clientPath));

const io = socket(server);

app.get("/", (req, res) => {
  res.render("home");
});

io.on("connection", function (socket) {
  console.log("Made socket connection");
});

server.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
