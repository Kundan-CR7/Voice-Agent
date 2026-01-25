import {useEffect,useState,useRef} from 'react'
import { noiseSuppression,playPCM16 } from '../utils/helper'

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
    <div className='p-8 rounded-lg shadow-xl flex flex-col justify-center items-center bg-transparent'>

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

        <div className='space-y-2'>
            <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`mt-6 px-6 py-3 rounded-lg font-semibold ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <p>Status: <span className={status=="connected"? "text-green-400" : "text-red-400" }>{status}</span></p>
            <p>User ID: <><span className='text-blue-400'>{userId || "Waiting"}</span></> </p>
          
            <div className='mt-6 bg-gray-700 p-4 rounded-lg max-h-64 overflow-y-auto'>
                <h2 className='font-semibold mb-2'>Live Transcript</h2>
                {transcripts.length === 0 ? (
                    <p className='text-gray-400 text-sm'>No transcript yet...</p>
                ) : (
                    transcripts.map((t, i) => (
                        <p key={i} className={`mb-2 ${t.role === 'user' ? 'text-green-300' : 'text-blue-300'}`}>
                            <strong>{t.role === 'user' ? 'You' : 'Agent'}:</strong> {t.text}
                        </p>
                    ))
                )}
            </div>
        </div>
    </div>
  )
}

export default VoiceAgent