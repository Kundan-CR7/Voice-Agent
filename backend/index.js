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

const sessions = new Map();

wss.on("connection",(ws) => {
    const userId = Math.random().toString(36).substring(7)
    sessions.set(userId,{state : "idle", buffer: []})
    console.log(`User ${userId} connected`);

    ws.on("message",(data) => {
        console.log(`Received ${data.length} bytes from ${userId}`);
    })
    ws.on("close", () => sessions.delete(userId));
})