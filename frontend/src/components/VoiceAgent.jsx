import {useEffect,useState,useRef} from 'react'
import { noiseSuppression,playPCM16 } from '../utils/helper'
import { AudioWaveform } from './AudioWaveForm'

const VoiceAgent = () => {
    const [userId,setUserId] = useState(null)
    const [status,setStatus] = useState("disconnected")
    const wsRef = useRef(null)
    const [isRecording,setIsRecording] = useState(false)
    const audioContextRef = useRef(null)
    const streamRef = useRef(null)
    const processorRef = useRef(null)
    const [agentState,setAgentState] = useState("idle")
    const [transcripts, setTranscripts] = useState([])


    const startRecording = async() => {
        try{
            if (!window.ttsAudioCtx) {
                window.ttsAudioCtx = new AudioContext({ sampleRate: 16000 })
                await window.ttsAudioCtx.resume()
                console.log("TTS AudioContext unlocked")
            }
            streamRef.current = await navigator.mediaDevices.getUserMedia({audio:true})
            audioContextRef.current = new AudioContext({sampleRate:16000})
            await audioContextRef.current.audioWorklet.addModule('/audio-processor.js')

            const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
            processorRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor')

            processorRef.current.port.onmessage = (e) => {
                // const suppressed = noiseSuppression(e.data)
                if(wsRef.current?.readyState === WebSocket.OPEN){
                    const data = e.data
                    for(let i=0;i<data.length;i++){
                        data[i] *= 1.5
                    }
                    wsRef.current.send(data.buffer)
                }
            }
            source.connect(processorRef.current)
            setIsRecording(true)
        }catch(error){
            console.log("Mic access denied: ",error)
        }
    }

    const stopRecording = async() => {
        streamRef.current?.getTracks().forEach(track => track.stop())
        audioContextRef.current?.close()
        setIsRecording(false)
    }

    useEffect(() => {
        wsRef.current = new WebSocket("ws://localhost:3000")
        wsRef.current.binaryType = "arraybuffer"
        wsRef.current.onopen = () => {
            setStatus("connected")
        }
        wsRef.current.onmessage = async(event) => {
            console.log("WS received:", event.data?.constructor?.name)

            if(event.data instanceof ArrayBuffer) {
                console.log("Audio received, bytes:", event.data.byteLength)
                playPCM16(event.data)
                setAgentState("speaking")
                return
  }

            if(event.data instanceof Blob){
                const arrayBuffer = await event.data.arrayBuffer()
                playPCM16(arrayBuffer)
                setAgentState("speaking")
                return
            }
            const msg = JSON.parse(event.data)
            if(msg.type == "session_id"){
                setUserId(msg.userId)
            }
            if(msg.type == "agent_state"){
                setAgentState(msg.state)
            }
            if(msg.type == "transcript"){
                setTranscripts(prev => [...prev,{
                    role : msg.role,
                    text : msg.text
                }])
            }
        }
        wsRef.current.onclose = () => {
            setStatus("disconnected")
        }
        return () => wsRef.current?.close()
    },[])

  return (
    <div className='p-8 rounded-lg shadow-xl flex flex-col items-center bg-transparent border min-w-[60vw] min-h-[85vh]'>

        {/* Avatar */}
        <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 shadow-2xl z-10
            ${agentState === "speaking" ? "ring-4 ring-purple-500 animate-pulse" : ""}
            ${agentState === "listening" ? "ring-4 ring-blue-500 animate-pulse" : ""}
            `}>
            <img src='/agent.jpg' className='h-full w-full object-cover'/>
        </div>

        {/* State */}
        <div className='mt-4 flex items-center space-x-2 border border-gray-500 bg-transparent px-4 py-1 rounded-full'>
            <div className={`w-3 h-3 rounded-full ${
                agentState === 'listening' ? 'bg-blue-500 animate-pulse' :
                agentState === 'thinking' ? 'bg-yellow-500 animate-pulse' :
                agentState === 'speaking' ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'
            }`}></div>
            <p className='capitalize'>{agentState}</p>
        </div>

        {/* AudioWaveform */}
        <AudioWaveform state={agentState}/>
        

        {/* Control */}
        <div className='space-y-2 max-w-full md:max-w-[90vw] p-4 flex flex-col items-center'>
            <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
                group relative inline-flex items-center gap-2
                px-8 py-3 rounded-2xl font-semibold
                transition-all duration-300
                shadow-lg shadow-primary/20 hover:shadow-primary/40

                ${
                !isRecording
                    ? "bg-[#736ced] text-white hover:bg-primary/90 focus:ring-primary"
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


            {/* Transcript */}
            <h2 className="font-semibold mb-2 text-gray-200 text-center font-serif">{transcripts.length==0 ? "" : "Live Transcript"}</h2>
            <div className="mt-6 w-full max-w-full md:max-w-[70vh] mx-auto backdrop-blur-md p-4 rounded-2xl max-h-64 overflow-y-auto space-y-5">

                {transcripts.length === 0 ? (
                    <p className="text-gray-400 text-sm">Try to Speak Something!...</p>
                ) : (
                    transcripts.map((t, i) => (
                    <div
                        key={i}
                        className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow border-4
                            ${t.role === 'user'
                            ? 'bg-gray-800/70 text-green-300 border border-white/5 rounded-bl-sm'
                            : 'bg-blue-500/20 text-blue-200 border border-blue-400/20 rounded-br-sm'
                            }`}
                        >
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-50">
                            {t.role === 'user' ? 'You' : 'Agent'}
                        </div>
                        {t.text}
                        </div>
                    </div>
                    ))
                )}
            </div>

        </div>
    </div>
  )
}

export default VoiceAgent