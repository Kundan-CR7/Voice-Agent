export function noiseSuppression(audioData){
    const threshold = 0.01
    const output = new Float32Array(audioData.length)
    for(let i=0;i<audioData.length;i++){
        output[i] = Math.abs(audioData[i]) > threshold ? audioData[i] : 0
    }
    return output
}

let ttsAudioCtx

export function playPCM16(buffer){
    console.log("Playing audio, bytes:", buffer.byteLength)
    if (!ttsAudioCtx) {
        ttsAudioCtx = new AudioContext({ sampleRate: 16000 })
    }

    if(ttsAudioCtx.state === "suspended"){
        ttsAudioCtx.resume()
    }
    
    const pcm16 = new Int16Array(buffer)
    const float32 = new Float32Array(pcm16.length)

    for(let i=0;i<pcm16.length;i++){
        float32[i] = pcm16[i]/0x8000
    }

    const audioBuffer = ttsAudioCtx.createBuffer(1,float32.length,16000)
    audioBuffer.getChannelData(0).set(float32)

    const source = ttsAudioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ttsAudioCtx.destination)
    source.start()
    console.log("TTS context state:", ttsAudioCtx.state)
}