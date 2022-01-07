const express = require("express");
const socket = require("socket.io");
const path = require("path");
const http = require("http");
const ejs = require("ejs");
const cors = require("cors");
const { v4: uuidV4 } = require("uuid");

// PORT setup
const PORT = 8000;

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

const ChatCodes = {
  WARNING: 1,
  NEW_USER: 2,
  OTHERSUSERS: 3,
};

var ROOMS = [];

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/chat/room", (req, res) => {
  let roomStructure = {
    id: uuidV4(),
    pwd: "123123" + Math.random() * (100 - 10) + 10 + "98642",
    users: [],
  };
  ROOMS.push(roomStructure);
  res.render("room", { roomId: roomStructure.id });
});

app.get("/chat/:room", (req, res) => {
  var foundIndex = ROOMS.findIndex((x) => x.id == req.params.room);
  if (foundIndex > -1) res.render("room", { roomId: req.params.room });
  else res.render("home");
});

//    window.location.reload(); -> RENDER AFTER POST REQUEST

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);

    socket.broadcast.to(roomId).emit("user-connected", userId);

    var foundIndex = ROOMS.findIndex((x) => x.id == roomId);
    ROOMS[foundIndex].users.push(userId);

    console.log(ROOMS);
    socket.broadcast.to(roomId).emit("chat", {
      code: ChatCodes.NEW_USER,
      message: userId + " entered the room",
    });

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);

      socket.broadcast.to(roomId).emit("chat", {
        code: ChatCodes.NEW_USER,
        message: userId + " left the room",
      });

      var foundIndex = ROOMS.findIndex((x) => x.id == roomId);
      if (foundIndex > -1) {
        if (ROOMS[foundIndex].users.length <= 1) {
          var userIndex = ROOMS[foundIndex].users.indexOf(userId);
          if (userIndex > -1) {
            ROOMS[foundIndex].users.splice(userIndex, 1);
          }
        } else {
          ROOMS.splice(foundIndex, 1);
        }
      }
    });
  });

  socket.on("userinroom", (roomId) => {
    var foundIndex = ROOMS.findIndex((x) => x.id == roomId);

    io.to(socket.id).emit("others", {
      users: ROOMS[foundIndex].users,
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
