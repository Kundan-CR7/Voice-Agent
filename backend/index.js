import express, { text } from "express"
import cors from "cors"
import "dotenv/config"
import WebSocket,{WebSocketServer} from "ws"
import { calculateRMS,createWavBuffer} from "./src/helper.js"
import { deepgram } from "./src/deepgramClient.js"
import { getLLMResponse } from "./src/llm/openrouter.js"
import { textToSpeech } from "./src/tts/deepgram.js"


const app = express()
app.use(cors())

app.get("/", (req, res) => {
  res.send("Voice Agent backend is live");
});


const PORT = process.env.PORT || 3000

const server = app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

const wss = new WebSocketServer({server})

const sessions = new Map();

// VAD Configuration
const volumeThreshold = 0.02
const silenceThreshold = 0.01
const silenceDurationMS = 600
const minSpeechFrames = 10
const frameMS = 250
const MIN_FRAMES_FOR_STT = 20;

async function processAudioBuffer(frames, userId, ws, e2eStartTime) {
    if (frames.length < MIN_FRAMES_FOR_STT) {
        console.log(`[${userId}] Skipping STT (too short)`);
        return;
    }

    const totalLength = frames.reduce((s, a) => s + a.length, 0);
    const combined = new Float32Array(totalLength);

    let offset = 0;
    for (const arr of frames) {
        combined.set(arr, offset);
        offset += arr.length;
    }
    const wav = createWavBuffer(combined);

    console.log(`[${userId}] STT with ${frames.length} frames`);

    const sttStartTime = Date.now()

    const { result } = await deepgram.listen.prerecorded.transcribeFile(wav, {
        model: "nova-2",
        smart_format: true,
        punctuate: true,
        language: "en",
        utterances : true
    });

    const sttEndTime = Date.now()
    const sttLatency = sttEndTime - sttStartTime

    const transcript =
        result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    console.log(`[${userId}] Transcript:`, transcript);

    if(transcript){
        ws.send(JSON.stringify({
            type: "transcript",
            role: "user",
            text: transcript,
        }));

        ws.send(JSON.stringify({
            type : "metric",
            name : "sttLatency",
            data : sttLatency
        }))

        const {text,metrics} = await getLLMResponse(transcript) //LLM Reply

        ws.send(JSON.stringify({
            type : "metric",
            name : "llmLatency",
            data : metrics.totalLatency
        }))

        ws.send(JSON.stringify({
            type: "metric",
            name: "llmTTFT",
            data: metrics.ttft
        }));

        const agentReply = text
        console.log(`Agent Reply: ${agentReply}`)

        ws.send(JSON.stringify({
            type : "transcript",
            role : "agent",
            text : agentReply
        }))

        //TTS
        const ttsResult = await textToSpeech(agentReply)

        //E2ELatency
        const agentAudioReadyAt = Date.now()
        if(e2eStartTime){
            const e2eLatency = agentAudioReadyAt - e2eStartTime
            console.log("E2ELatency: ",e2eLatency)
            ws.send(JSON.stringify({
                type: "metric",
                name: "e2eLatency",
                data: e2eLatency
            }))
        }

        ws.send(JSON.stringify({
            type : "metric",
            name : "ttsLatency",
            data : ttsResult.ttsLatency
        }))
        ws.send(ttsResult.audioBuffer)
    }
}

wss.on("connection",(ws) => {
    const userId = Math.random().toString(36).substring(7)
    sessions.set(userId,{
        state : "idle", 
        buffer: [],
        speechFrameCount:0,
        speechStartTime: null,
        lastSpeechTime: null
    })
    console.log(`User ${userId} connected`);

    ws.send(JSON.stringify({
        type : "session_id",
        userId: userId
    }))

    ws.on("message",(data) => {
        const session = sessions.get(userId)
        if(!session) return;

        let float32Data;
        if(data instanceof Buffer){
            float32Data = new Float32Array(data.buffer, data.byteOffset, data.length / 4)
        }else{
            return
        }
        const rms = calculateRMS(float32Data)

        // VAD
        if(rms > volumeThreshold){
            const now = Date.now()
            if(!session.speechStartTime){
                session.speechStartTime = now
            }
            session.lastSpeechTime = now
            session.speechEndTime = now

            session.speechFrameCount++
            // Speech Detected
            if(session.state=="idle" && session.speechFrameCount >= minSpeechFrames){
                session.state="listening"
                console.log(`User ${userId} started speaking`);
                ws.send(JSON.stringify({
                    type : "agent_state",
                    state : "listening"
                }))
            }
            session.buffer.push(float32Data)
        }else{
            // Silence Detected
            if(session.state == "listening" && session.lastSpeechTime && Date.now()-session.lastSpeechTime > silenceDurationMS){
                console.log(`[${userId}] stopped speaking`)

                //VAD Metrics
                const vadDetectedAt = Date.now()
                const e2eStartTime = vadDetectedAt
                const vadLatency = vadDetectedAt - session.speechEndTime

                console.log("VAD FIRED", {
                    vadLatency,
                    silenceDurationMS,
                    now: vadDetectedAt
                })


                ws.send(JSON.stringify({
                    type : "metric",
                    name : "vadLatency",
                    data : vadLatency
                }))

                session.state = "idle"

                ws.send(JSON.stringify({
                    type : "agent_state",
                    state : "thinking"
                }))

                const speechBuffer = session.buffer
                processAudioBuffer(speechBuffer,userId,ws,e2eStartTime)

                session.buffer = []
                session.speechFrameCount = 0
                session.lastSpeechTime = null
                session.speechStartTime = null

            }
        }

    })
    ws.on("close", () => sessions.delete(userId));
})