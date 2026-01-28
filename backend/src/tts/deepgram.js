import { deepgram } from "../deepgramClient.js"

export async function textToSpeech(text){
    const startTime = Date.now()

    const response = await deepgram.speak.request(
        {text},
        {
            model : "aura-asteria-en",
            encoding : "linear16",
            sample_rate : 16000
        }
    )
    const stream = await response.getStream()
    
    const reader = stream.getReader()
    const chunks = []

    while(true){
        const {value,done} = await reader.read()
        if(done) break
        chunks.push(Buffer.from(value))
    }
    const audioBuffer = Buffer.concat(chunks)
    const ttsLatency = Date.now() - startTime

    return {
        audioBuffer,
        ttsLatency
    }
}