require("dotenv").config();

const express = require("express");
const app = express();

// controller
const { webhookController } = require("./controllers/webhook.controller");

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // Saves the exact incoming bytes
    },
  }),
);

app.post("/webhook", webhookController);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("app is running on port 3000");
});