const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const admin = require("firebase-admin");
const cors = require("cors");

const CONFIG = require("./config/config");
const routes = require("./routes");

const firebaseServiceAccount = {
  type: CONFIG.FIREBASE_ACCOUNT_TYPE,
  project_id: CONFIG.FIREBASE_PROJECT_ID,
  private_key_id: CONFIG.FIREBASE_PRIVATE_KEY_ID,
  private_key: CONFIG.FIREBASE_PRIVATE_KEY,
  client_email: CONFIG.FIREBASE_CLIENT_EMAIL,
  client_id: CONFIG.FIREBASE_CLIENT_ID,
  auth_uri: CONFIG.FIREBASE_AUTH_URI,
  token_uri: CONFIG.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: CONFIG.FIREBASE_AUTH_PROVIDER_x509_CERT_URL,
  client_x509_cert_url: CONFIG.FIREBASE_CLIENT_x509_CERT_URL,
};

// const mongoConnectionURI = CONFIG.DB_PASSWORD && CONFIG.DB_USERNAME ?
// 	`mongodb://${CONFIG.DB_USERNAME}:${CONFIG.DB_PASSWORD}@${CONFIG.DB_URL}/${CONFIG.DB_NAME}?authSource=admin` :
// 	`mongodb://${CONFIG.DB_URL}/${CONFIG.DB_NAME}`

const mongoConnectionURI = CONFIG.LIVE_DB;

mongoose
  .connect(mongoConnectionURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  });

admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount),
  databaseURL: CONFIG.FIREBASE_RT_DB_URL,
});

const app = express();
app.use(express.json());

// Utilize a more restrictive policy if needed
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

if (CONFIG.APP_ENV == "development") {
  app.use(logger("dev"));
}

app.get("/", (req, res) => {
  res
    .status(200)
    .send("This is back-end server for <strong>Designners</strong>.");
});

app.get("/health", async (req, res) => {
  res.status(200).send({
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  });
});

app.use("/api", routes);

app.listen(CONFIG.port, () => {
  console.log("Server up on " + CONFIG.port);
});
