const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const isAuthauticated = require("./middlewares/isAuthauticated");

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const User = require("./models/User.js");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const fileUpload = require("express-fileupload");
const isAuthenticated = require("./middlewares/isAuthauticated");
const cloudinary = require("cloudinary").v2;

mongoose.connect(process.env.MONGODB_URI);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

app.post("/signup", fileUpload(), async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(req.files?.picture);
    const user = await User.findOne({ email: req.body.email });
    const avatar = req.files?.picture;

    if (user) {
      res.status(409).json({ message: "This email already has an account" });
    } else {
      if (req.body.email && req.body.password && req.body.username) {
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.body.password + salt).toString(encBase64);

        const newUser = new User({
          email: req.body.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: req.body.username,
          },
        });

        if (avatar) {
          const avatarToBe = await cloudinary.uploader.upload(
            convertToBase64(avatar),
            { folder: `/marvel/users/${newUser._id}` }
          );

          Object.assign(newUser.account, {
            avatar: avatarToBe,
          });
        }

        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    const loginUser = await User.findOne({ email: email });

    if (loginUser) {
      const hash = SHA256(password + loginUser.salt).toString(encBase64);

      if (hash === loginUser.hash) {
        res.json({
          id: loginUser.id,
          token: loginUser.token,
          account: loginUser.account,
        });
      } else {
        res.json({
          error: "unauthorized",
        });
      }
    } else {
      res.json({
        error: "invalid email",
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    // console.log(req.params)

    const favoris = await User.findById(req.params.id);
    console.log(favoris);
    res.json(favoris.favoris);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/comics", async (req, res) => {
  try {
    // console.log(req.query);
    // let title = "";
    // if (req.query.title) {
    //   title = new RegExp(req.query.title, "i");
    // }

    // let page;
    // if (Number(req.query.page) < 1) {
    //   page = 1;
    // } else {
    //   page = Number(req.query.page);
    // }

    let limit = Number(req.query.limit);
    let skip = Number(req.query.skip);

    const comics = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics?title=${req.query.title}&limit=${limit}&skip=${skip}&apiKey=${process.env.API_KEY}`
    );

    res.json(comics.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/comic/:id", async (req, res) => {
  try {
    // console.log(req.params);
    const comic = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comic/${req.params.id}?apiKey=${process.env.API_KEY}`
    );
    res.json(comic.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/characters", async (req, res) => {
  try {
    // console.log(req.query);
    // let name;
    // if (req.query.name) {
    //   name = new RegExp(req.query.name, "i");
    // }
    let limit = Number(req.query.limit);
    let skip = Number(req.query.skip);
    const characters = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/characters?name=${req.query.name}&limit=${limit}&skip=${skip}&apiKey=${process.env.API_KEY}`
    );
    // console.log(characters.data);
    res.json(characters.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/comics/:id", async (req, res) => {
  try {
    console.log(req.params);
    const comicsCharacter = await axios.get(
      ` https://lereacteur-marvel-api.herokuapp.com/comics/${req.params.id}?apiKey=${process.env.API_KEY}`
    );
    res.json(comicsCharacter.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/comic/favoris/", isAuthenticated, async (req, res) => {
  try {
    // console.log(req.body);
    // const comic = await axios.get(
    //   `https://lereacteur-marvel-api.herokuapp.com/comic/${req.params.id}?apiKey=${process.env.API_KEY}`
    // );
    // // console.log(comic.data);
    // // token: req.headers.authorization.replace("Bearer ", ""),
    const user = req.user;
    // console.log(user);

    user.favoris.comics.push(req.body.comic);
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/character/favoris/", isAuthenticated, async (req, res) => {
  try {
    // console.log(req.body);
    // const comic = await axios.get(
    //   `https://lereacteur-marvel-api.herokuapp.com/character/${req.params.id}?apiKey=${process.env.API_KEY}`
    // );
    // // console.log(comic.data);
    // // token: req.headers.authorization.replace("Bearer ", ""),
    const user = req.user;
    // console.log(user);

    user.favoris.characters.push(req.body.character);
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/delete/character/favoris/", isAuthenticated, async (req, res) => {
  try {
    console.log(req.body);
    const favorisToDelete = await User.findById(req.body.user);
    console.log(favorisToDelete);
    favorisToDelete.favoris.characters.splice(
      favorisToDelete.favoris.characters.indexOf(req.body.favoris),
      1
    );
    console.log(favorisToDelete);

    await favorisToDelete.save();

    res.json(favorisToDelete);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/delete/comic/favoris/", isAuthenticated, async (req, res) => {
  try {
    console.log(req.body);
    const favorisToDelete = await User.findById(req.body.user);
    console.log(favorisToDelete);
    favorisToDelete.favoris.comics.splice(
      favorisToDelete.favoris.comics.indexOf(req.body.favoris),
      1
    );
    console.log(favorisToDelete);

    await favorisToDelete.save();

    res.json(favorisToDelete);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.all("*", (req, res) => {
  res.status(404).json({
    message: "not available routes",
  });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});

// title=${title}page=${page}&limit=${limit}&
