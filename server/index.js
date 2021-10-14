const express = require("express");
const socket = require("socket.io");
const path = require("path");
const http = require("http");
const ejs = require("ejs");
const cors = require("cors");
const { v4: uuidV4 } = require("uuid");

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
app.set("views", clientPath + "/views");
app.use("/public", express.static(clientPath + "/public"));

const io = socket(server);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/chat/new", (req, res) => {
  res.redirect(`/chat/${uuidV4()}`);
});

/* 
Chat
  code = 1 -> new user
  code = 2 -> others msg 
*/

const ChatCodes = {
  WARNING: 1,
  NEW_USER: 2,
  OTHERSUSERS: 3,
};

app.get("/chat/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.broadcast.to(roomId).emit("chat", {
      code: ChatCodes.NEW_USER,
      message: userId + " entered the room",
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  socket.on("chat", (roomId, userId, msg) => {
    console.log(
      new Date().toISOString() + " Chat message from " + userId + ": " + msg
    );

    // Send message to others
    socket.broadcast.to(roomId).emit("chat", {
      code: ChatCodes.OTHERSUSERS,
      name: userId,
      message: msg,
    });

    // Send direct msg
    // io.to(socket.id).emit("chat", {
    //   name: "Me",
    //   message: msg,
    // });
  });
});

server.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
