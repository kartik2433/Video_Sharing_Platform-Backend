import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = new express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routes/user.route.js"

app.use("/users", userRouter);

// const sweets_ants = "https://www.codingninjas.com/studio/problem-of-the-day/easy"

export {app}