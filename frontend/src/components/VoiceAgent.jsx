import {useEffect,useState,useRef} from 'react'
import { noiseSuppression } from '../utils/helper'

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
            streamRef.current = await navigator.mediaDevices.getUserMedia({audio:true})
            audioContextRef.current = new AudioContext({sampleRate:16000})
            await audioContextRef.current.audioWorklet.addModule('/audio-processor.js')

            const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
            processorRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor')

            processorRef.current.port.onmessage = (e) => {
                const suppressed = noiseSuppression(e.data)
                if(wsRef.current?.readyState === WebSocket.OPEN){
                    wsRef.current.send(suppressed.buffer)
                }
            }
            source.connect(processorRef.current)
            processorRef.current.connect(audioContextRef.current.destination)
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
        wsRef.current.onopen = () => {
            setStatus("connected")
        }
        wsRef.current.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            if(msg.type == "session_id"){
                setUserId(msg.userId)
            }
            if(msg.type == "agent_state"){
                setAgentState(msg.state)
            }
            if(msg.type == "transcipt"){
                setTranscripts(prev => [...prev,{
                    role : msg.type,
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
    <div className='bg-gray-800 p-8 rounded-lg shadow-xl'>
        <h1 className='text-2xl font-bold mb-4'>Voice Agent</h1>
        <div className='space-y-2'>
            <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`mt-6 px-6 py-3 rounded-lg font-semibold ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <p>Status: <span className={status=="connected"? "text-green-400" : "text-red-400" }>{status}</span></p>
            <p>User ID: <><span className='text-blue-400'>{userId || "Waiting"}</span></> </p>
            <div className='mt-4 flex items-center space-x-2'>
                <div className={`w-3 h-3 rounded-full ${
                    agentState === 'listening' ? 'bg-blue-500 animate-pulse' :
                    agentState === 'thinking' ? 'bg-yellow-500 animate-pulse' :
                    agentState === 'speaking' ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'
                }`}></div>
                <p className='capitalize'>{agentState}</p>
            </div>
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