const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT || 5000;

const users = [
  {
    id: "1",
    username: "jhon",
    password: "jhon123",
    isAdmin: true,
  },
  {
    id: "2",
    username: "jenny",
    password: "jenny123",
    isAdmin: false,
  },
];
let refreshTokens = [];

app.get("/", (req, res) => {
  res.send("Hello there");
});

app.post("/api/refresh", (req, res) => {
  //Take ther refresh token from the user
  const refreshToken = req.body.token;

  //For invalid token
  if (!refreshToken) return res.status(401).json("You are not authenticated");
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refreesh token is not valied");
  }
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    err && console.log(err);

    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newFrreshToken = generateRefreshAccessToken(user);

    refreshTokens.push(newFrreshToken);
    res
      .status(200)
      .json({ accessToken: newAccessToken, refreshToken: newFrreshToken });
  });
});

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};
const generateRefreshAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    process.env.JWT_REFRESH_SECRET
  );
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshAccessToken(user);
    refreshTokens.push(refreshToken);
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400).json("Username or password incorrect");
  }
});

// Verify JWT

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        res.status(401).json("Token not valid");
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json("You are not authorized to access this");
  }
};

//Delete
app.delete("/api/users/:userId", verify, (req, res) => {
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("User has been deleted");
  } else {
    res.status(403).json("You are not allowed to delete this user");
  }
});

app.post("/api/logout", verify, (req, res) => {
  const refreshToken = req.body.token;
  refreshtokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json("You logged out successfully");
});

app.listen(port, () => {
  console.log(`Backend Server listening on port ${port}`);
});
