import express from "express"
import cors from "cors"
import WebSocket,{WebSocketServer} from "ws"

const app = express()
app.use(cors())

const PORT = 3000

const server = app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

const wss = new WebSocketServer({server})

wss.on("connection",(ws) => {
    console.log("Client Connected")

    ws.on("message",(data) => {
        console.log("Received audio chunk:",data.length)
    })
})