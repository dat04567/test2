const express = require("express");
const app = express();
const configAWS = require("./config/aws");
const path = require("path");
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", "views");

const articleRoutes = require("./routes/articleRoutes");

// Load AWS configuration
configAWS.configAWS();

app.use("/", articleRoutes);

// middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
