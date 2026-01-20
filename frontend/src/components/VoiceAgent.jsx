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


    const startRecording = async() => {
        try{
            streamRef.current = await navigator.mediaDevices.getUserMedia({audio:true})
            audioContextRef.current = new AudioContext({sampleRate:16000})
            const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
            processorRef.current = audioContextRef.current.createScriptProcessor(4096,1,1)

            processorRef.current.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0)    // Raw Audio Data
                const suppressed = noiseSuppression(input)
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
        </div>
    </div>
  )
}

export default VoiceAgent