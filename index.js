import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import morgan from "morgan";
import connect from "./db/connection.js";
import router from "./router/route.js";

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));
app.disable("x-powered-by"); //less hackers know about our stack
app.use(fileUpload());

const port = 8080;

// HTTP GET REQUEST
app.get("/", (req, res) => {
  res.status(200).json("Home GET Request");
});

// api routes
app.use("/api", router);

// Start server only when we have valid connection
connect()
  .then(() => {
    try {
      app.listen(port, () => {
        console.log(`Server connected to http://localhost:${port}`);
      });
    } catch (error) {
      console.log("Cannot connect to the server");
    }
  })
  .catch((error) => {
    console.log("Invalid database connection");
  });
