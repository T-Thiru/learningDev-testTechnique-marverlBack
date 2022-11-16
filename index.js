const express = require("express");
const cors = require("cors");
const axios = require("axios");

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/comics", async (req, res) => {
  try {
    // console.log(req.query);
    // let title = "";
    // if (req.query.title) {
    //   title = new RegExp(req.query.title, "gi");
    // }

    // let page;
    // if (Number(req.query.page) < 1) {
    //   page = 1;
    // } else {
    //   page = Number(req.query.page);
    // }

    // let limit = Number(req.query.limit);

    const comics = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics?&apiKey=${process.env.API_KEY}`
    );

    res.json(comics.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/comic/:id", async (req, res) => {
  try {
    console.log(req.params);
    const comic = await axios.get(
      ` https://lereacteur-marvel-api.herokuapp.com/comic/${req.params.id}?apiKey=${process.env.API_KEY}`
    );
    res.json(comic.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/characters", async (req, res) => {
  try {
    const characters = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.API_KEY}`
    );
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

app.all("*", (req, res) => {
  res.status(404).json({
    message: "not available routes",
  });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});

// title=${title}page=${page}&limit=${limit}&
