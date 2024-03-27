import { initSocketServer } from '../server/SocketServer.js'
import { app } from "../server/app.js";
import connectDb from "./utils/db.js";
import { v2 as cloudinary } from 'cloudinary'
import http from 'http'
require("dotenv").config();


const server=http.createServer(app)

// cloudinary setup

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY
})

 initSocketServer(server)
// Create server

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT} `);
  connectDb()
});
