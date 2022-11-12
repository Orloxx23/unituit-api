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
const subscriptionRoute = require("./routes/subscription");
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

const port = process.env.PORT || 8800;

app.use(cors());

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
app.use("/api/subscription", subscriptionRoute);

const httpServer = createServer(app);

httpServer.listen(port, () => {
  console.log("Backend server is running! Port: " + port);
});

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*",
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

  socket.on("likePost", ({ senderId, receiverId, postId }) => {
    const receiver = getUser(receiverId);
    console.log("enviando a ", receiver);
    io.to(receiver.socketId).emit("getLikePost", { senderId, postId });
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", onlineUsers);
  });
});

io.listen(5000);
