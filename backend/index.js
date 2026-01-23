import express, { text } from "express"
import cors from "cors"
import dotenv from "dotenv"
import WebSocket,{WebSocketServer} from "ws"
import { calculateRMS,createWavBuffer } from "./src/helper.js"
import { createClient } from "@deepgram/sdk"
dotenv.config()

const deepgram = createClient(process.env.DEEPGRAM_API_KEY)

const app = express()
app.use(cors())

const PORT = 3000

const server = app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

const wss = new WebSocketServer({server})

const sessions = new Map();

// VAD Configuration
const volumeThreshold = 0.02
const silenceThreshold = 0.01
const silenceDurationMS = 800
const minSpeechFrames = 3
const frameMS = 250

const processAudioBuffer = async(buffer,userId,ws) => {
    console.log(`${userId} Starting STT with ${buffer.listen} frames`)
    try{
        const totalLength = buffer.reduce((sum,arr) => sum+arr.length,0)
        const combined = new Float32Array(totalLength)
        let offset = 0
        for(const arr of buffer){
            combined.set(arr,offset)
            offset += arr.length
        }
        const waveBuffer = createWavBuffer(combined)
        console.log(`${userId} WAV buffer size: ${waveBuffer.length} bytes`)

        const {result} = await deepgram.listen.prerecorded.transcribeFile(
            waveBuffer,
            {model: "nova-2",smart_format:true}
        )
        const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript
        console.log(`[${userId}] Transcript: ${transcript}`)
        if(transcript){
            ws.send(JSON.stringify({
                type : "transcript",
                role : "user",
                text : transcript
            }))
            console.log(`[${userId}] Sent transcript to client`)
        }
    }catch(error){
        console.log(`STT Error: ${error}`)
    }
}

wss.on("connection",(ws) => {
    const userId = Math.random().toString(36).substring(7)
    sessions.set(userId,{state : "idle", buffer: []})
    console.log(`User ${userId} connected`);

    ws.send(JSON.stringify({
        type : "session_id",
        userId: userId
    }))

    ws.on("message",(data) => {
        const session = sessions.get(userId)
        if(!session) return;

        const float32Data = new Float32Array(data.buffer)
        const rms = calculateRMS(float32Data)

        // VAD
        if(rms > volumeThreshold){
            // Speech Detected
            if(session.state=="idle"){
                session.state="listening"
                console.log(`User ${userId} started speaking`);
                ws.send(JSON.stringify({
                    type : "agent_state",
                    state : "listening"
                }))
            }
            session.buffer.push(float32Data)
            session.lastSpeechTime = Date.now()
        }else{
            // Silence Detected
            console.log(`User ${userId} RMS: ${rms.toFixed(4)}`);
        }

    })
    ws.on("close", () => sessions.delete(userId));
})