const express = require("express");
const { createServer } = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const router = express.Router();
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

dotenv.config();

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);
app.use("/images", express.static(path.join(__dirname, "public/images")));

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
//app.use(express.urlencoded({ extended: true }));

const whitelist = [
  "https://unituit-client.vercel.app",
  "http://localhost:3000",
];

const port = process.env.PORT || 8800;

app.use(cors({ origin: whitelist }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);

const httpServer = createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "https://unituit-client.vercel.app"
    //origin: "http://localhost:3000",
    // origin: function (origin, callback) {
    //   if (whitelist.indexOf(origin) > -1) {
    //     callback(null, true);
    //   } else {
    //     callback(null, false);
    //   }
    // },
  },
});

let onlineUsers = [];

const addUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", onlineUsers);
  });

  socket.on("newNotification", ({ senderId, receiverId, type, text }) => {
    switch (type) {
      case "like":
        const receiverl = getUser(receiverId);
        console.log("enviando a ", receiverl);
        io.to(receiverl.socketId).emit("getNotification", { senderId, type });
        break;
      case "post":
        receiverId.forEach((follower) => {
          const user = getUser(follower);
          if (user) {
            io.to(user.socketId).emit("getNotification", {
              senderId,
              type,
              text,
            });
          }
        });
        break;
      case "follow":
        const receiverf = getUser(receiverId);
        console.log("enviando a ", receiverf);
        io.to(receiverf.socketId).emit("getNotification", { senderId, type });
        break;
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", onlineUsers);
  });
});

httpServer.listen(port, () => {
  console.log("Backend server is running! Port: " + port);
});
