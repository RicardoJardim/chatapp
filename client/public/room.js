const socket = io("/");

const videoGrid = document.getElementById("video-grid");

const myPeer = new Peer(undefined, {
  host: "/",
  port: "5001",
});

const myVideo = document.createElement("video");
myVideo.muted = true;

var myID;

const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    console.log("ola");
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  })
  .catch(function (err) {
    alert(err);

    const defaultvideo = document.createElement("div");
    defaultvideo.className = "novideo";

    const txt = "Fake Nigga";
    const card = createVideoCard(txt, defaultvideo);

    videoGrid.append(card);
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

socket.on("chat", (data) => {
  let el = document.getElementById("scrollable");
  switch (data.code) {
    case 1:
    case 2:
      el.innerHTML += `<div class='chatBallon newuser'>${data.message} </div>`;
      break;
    case 3:
      el.innerHTML += `<div class='chatBallon others'>${data.message} </div>`;
      break;
  }
});

document.getElementById("send").onclick = () => {
  var text = document.getElementById("text").value;
  if (/\S/.test(text)) {
    document.getElementById(
      "scrollable"
    ).innerHTML += `<div class='chatBallon mine'>${text.trim()}</div>`;

    socket.emit("chat", ROOM_ID, myID, text.trim());
    document.getElementById("text").value = "";
  }
};

myPeer.on("open", (id) => {
  myID = id;
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  const txt = "Fake Nigga";
  const card = createVideoCard(txt, video);
  //videoGrid.append(video);
  videoGrid.append(card);
}

function createVideoCard(txt, obj) {
  const card = document.createElement("div");
  card.className = "cardVideo";

  const text = document.createElement("span");
  text.innerHTML = txt;

  card.appendChild(obj);
  card.appendChild(text);

  return card;
}
