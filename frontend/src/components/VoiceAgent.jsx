import { useEffect, useState, useRef } from 'react'
import { noiseSuppression, playPCM16, calculateRMS } from '../utils/helper.js'
import { AudioWaveform } from './AudioWaveform.jsx'
import RMSGraph from './RMSGraph.jsx'

const VoiceAgent = ({ setRmsData, setMetrics,isFullScreen }) => {
    const [userId, setUserId] = useState(null)
    const [status, setStatus] = useState("disconnected")
    const wsRef = useRef(null)
    const [isRecording, setIsRecording] = useState(false)
    const audioContextRef = useRef(null)
    const streamRef = useRef(null)
    const processorRef = useRef(null)
    const [agentState, setAgentState] = useState("idle")
    const [transcripts, setTranscripts] = useState([])
    const agentSourceRef = useRef(null)
    const isAgentSpeakingRef = useRef(false)
    const rmsHistoryRef = useRef([]);
    const localUrl = import.meta.env.VITE_LOCAL_URL
    const hostedUrl = import.meta.env.VITE_HOSTED_URL
    const transcriptRef = useRef(null)
    const transcriptEndRef = useRef(null)

    const startRecording = async () => {
        try {
            if (!window.ttsAudioCtx) {
                window.ttsAudioCtx = new AudioContext({ sampleRate: 16000 })
                await window.ttsAudioCtx.resume()
                console.log("TTS AudioContext unlocked")
            }
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
            audioContextRef.current = new AudioContext({ sampleRate: 16000 })
            await audioContextRef.current.audioWorklet.addModule('/audio-processor.js')

            const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
            processorRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor')

            let frameCount = 0;
            processorRef.current.port.onmessage = (e) => {
                const data = e.data
                const rms = calculateRMS(data)

                rmsHistoryRef.current.push(rms);
                if (rmsHistoryRef.current.length > 400) {
                    rmsHistoryRef.current.shift()
                }

                frameCount++
                if (frameCount % 5 === 0) {
                    setRmsData([...rmsHistoryRef.current])
                }
                // BARGE-IN
                if (isAgentSpeakingRef.current && rms > 0.04) {
                    console.log("Barge-in detected")
                    if (agentSourceRef.current) {
                        agentSourceRef.current.stop()
                        agentSourceRef.current = null
                    }

                    isAgentSpeakingRef.current = false
                    setAgentState("listening")
                }

                // const suppressed = noiseSuppression(e.data)
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const data = e.data
                    wsRef.current.send(data.buffer)
                }
            }
            source.connect(processorRef.current)
            setIsRecording(true)
        } catch (error) {
            console.log("Mic access denied: ", error)
        }
    }

    const stopRecording = async () => {
        streamRef.current?.getTracks().forEach(track => track.stop())
        audioContextRef.current?.close()
        setIsRecording(false)
    }

    const playAgentAudio = (buffer) => {
        // STOP previous agent speech if any
        if (agentSourceRef.current) {
            agentSourceRef.current.stop()
            agentSourceRef.current = null
        }

        const audioCtx = window.ttsAudioCtx
        const pcm16 = new Int16Array(buffer)
        const float32 = new Float32Array(pcm16.length)

        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 0x8000
        }

        const aduioBuffer = audioCtx.createBuffer(1, float32.length, 16000)
        aduioBuffer.getChannelData(0).set(float32)

        const source = audioCtx.createBufferSource()
        source.buffer = aduioBuffer
        source.connect(audioCtx.destination)

        agentSourceRef.current = source
        isAgentSpeakingRef.current = true
        setAgentState("speaking")

        source.onended = () => {
            isAgentSpeakingRef.current = false
            agentSourceRef.current = null
            setAgentState("idle")
        }
        source.start()
    }


    useEffect(() => {
        wsRef.current = new WebSocket(hostedUrl)
        wsRef.current.binaryType = "arraybuffer"
        wsRef.current.onopen = () => {
            setStatus("connected")
        }
        wsRef.current.onmessage = async (event) => {
            console.log("WS received:", event.data?.constructor?.name)

            if (event.data instanceof ArrayBuffer) {
                console.log("Audio received, bytes:", event.data.byteLength)
                playAgentAudio(event.data)
                setAgentState("speaking")
                return
            }

            if (event.data instanceof Blob) {
                const arrayBuffer = await event.data.arrayBuffer()
                playAgentAudio(arrayBuffer)
                setAgentState("speaking")
                return
            }
            const msg = JSON.parse(event.data)
            if (msg.type == "session_id") {
                setUserId(msg.userId)
            }
            if (msg.type == "metric") {
                setMetrics(prev => ({
                    ...prev,
                    [msg.name]: msg.data
                }))
            }
            if (msg.type == "agent_state") {
                setAgentState(msg.state)
            }
            if (msg.type == "transcript") {
                setTranscripts(prev => [...prev, {
                    role: msg.role,
                    text: msg.text
                }])
            }
        }
        wsRef.current.onclose = () => {
            setStatus("disconnected")
        }
        return () => wsRef.current?.close()
    }, [])

    useEffect(() => {
        if (!transcriptRef.current) return

        transcriptEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        })
    }, [transcripts])

    return (
        <div className={`
             relative
            flex flex-col items-center 
            rounded-3xl border border-slate-800
            bg-slate-900/80 shadow-2xl
            transition-all duration-500 ease-in-out
            overflow-hidden
             ${isFullScreen ? 'h-full w-full' : 'h-[85vh] w-full min-w-[55vw]'}
        `}>

            <div className="w-full flex-1 flex flex-col items-center p-8 gap-6 relative z-10">

                {/* Avatar Section */}
                <div className="relative group">
                    {/* Glow ring */}
                    <div className={`absolute -inset-1 rounded-full blur-sm opacity-50 transition duration-500 
                ${agentState === "speaking" ? "bg-purple-500/50" : agentState === "listening" ? "bg-indigo-500/50" : "bg-transparent"}
                `}></div>

                    <div className={`relative w-36 h-36 rounded-full overflow-hidden border-4 z-10 shadow-2xl transition-all duration-300
                ${agentState === "speaking" ? "border-purple-500 scale-105" : ""}
                ${agentState === "listening" ? "border-indigo-400 scale-105" : "border-slate-700"}
                `}>
                        <img src='/agent.jpg' className='h-full w-full object-cover transition-transform duration-700 hover:scale-110' alt="Agent" />
                    </div>
                </div>

                {/* State Badge */}
                <div className='flex items-center space-x-2.5 bg-slate-950/50 border border-slate-700 px-5 py-2 rounded-full shadow-inner'>
                    <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${agentState === 'listening' ? 'bg-indigo-500 animate-pulse shadow-indigo-500/50' :
                        agentState === 'thinking' ? 'bg-amber-400 animate-pulse shadow-amber-400/50' :
                            agentState === 'speaking' ? 'bg-purple-500 animate-pulse shadow-purple-500/50' : 'bg-slate-500'
                        }`}></div>
                    <p className='capitalize text-sm font-medium text-slate-300 tracking-wide'>{agentState}</p>
                </div>

                {/* AudioWaveform */}
                <div className={`transition-all duration-500 ${isFullScreen ? 'scale-125 my-8' : 'scale-100 my-2'}`}>
                    <AudioWaveform state={agentState} />
                </div>

                {/* Control Button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`
                group relative inline-flex items-center gap-2
                px-8 py-3 rounded-2xl font-semibold
                transition-all duration-300
                shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40

                ${!isRecording
                            ? "bg-[#736ced] text-white hover:bg-[#605ac7] focus:ring-[#736ced]"
                            : "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 focus:ring-red-500"
                        }
            `}
                >
                    {isRecording ? "Stop Recording" : "Start Recording"}

                    {isRecording && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                        </span>
                    )}
                </button>


                {/* Transcript Area */}
                <div
                    className="flex-1 w-full max-w-4xl px-2 py-4 overflow-y-auto space-y-4 custom-scrollbar mask-image-gradient"
                    ref={transcriptRef}
                >
                    {transcripts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                            <p className="text-sm">Start the conversation to see transcripts...</p>
                        </div>
                    ) : (
                        transcripts.map((t, i) => (
                            <div
                                key={i}
                                className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div
                                    className={`max-w-[80%] px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-md
                            ${t.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-500/10'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm shadow-slate-900/20'
                                        }`}
                                >
                                    <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60 ${t.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {t.role === 'user' ? 'You' : 'Agent'}
                                    </div>
                                    {t.text}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={transcriptEndRef} />
                </div>

            </div>
        </div>
    )
}

export default VoiceAgent