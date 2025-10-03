import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import "./db/connection/conn.js"
const app = express()
import tickets from "./router/router.js"

const port =  process.env.PORT || 1203

app.use(express.json())
app.use(cors())
app.use(cookieParser())

app.get("/", (req,res)=>{
    res.status(200).json("This is working")
})
app.use('/tickets' , tickets)




app.listen(port, ()=>{
    console.log("The App is listening")
})