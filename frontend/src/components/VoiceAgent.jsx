import {useEffect,useState,useRef} from 'react'
import { noiseSuppression,playPCM16,calculateRMS } from '../utils/helper.js'
import { AudioWaveform } from './AudioWaveform.jsx'
import RMSGraph from './RMSGraph.jsx'

const VoiceAgent = ({setRmsData,setMetrics}) => {
    const [userId,setUserId] = useState(null)
    const [status,setStatus] = useState("disconnected")
    const wsRef = useRef(null)
    const [isRecording,setIsRecording] = useState(false)
    const audioContextRef = useRef(null)
    const streamRef = useRef(null)
    const processorRef = useRef(null)
    const [agentState,setAgentState] = useState("idle")
    const [transcripts, setTranscripts] = useState([])
    const agentSourceRef = useRef(null)
    const isAgentSpeakingRef = useRef(false)
    const rmsHistoryRef = useRef([]);
    const localUrl = import.meta.env.VITE_LOCAL_URL
    const hostedUrl = import.meta.env.VITE_HOSTED_URL
    const e2eStartRef = useRef(null);

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

            let frameCount = 0;
            processorRef.current.port.onmessage = (e) => {
                const data = e.data
                const rms = calculateRMS(data)

                rmsHistoryRef.current.push(rms);
                if(rmsHistoryRef.current.length > 400){
                    rmsHistoryRef.current.shift()
                }

                frameCount++
                if (frameCount % 5 === 0) {
                    setRmsData([...rmsHistoryRef.current])
                }
                // BARGE-IN
                if(isAgentSpeakingRef.current && rms>0.04){
                    console.log("Barge-in detected")
                    if(agentSourceRef.current){
                        agentSourceRef.current.stop()
                        agentSourceRef.current = null
                    }
                    
                    isAgentSpeakingRef.current = false
                    setAgentState("listening")
                }

                // const suppressed = noiseSuppression(e.data)
                if(wsRef.current?.readyState === WebSocket.OPEN){
                    const data = e.data
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

    const playAgentAudio = (buffer) => {
        // STOP previous agent speech if any
        if(agentSourceRef.current){
            agentSourceRef.current.stop()
            agentSourceRef.current = null
        }

        const audioCtx = window.ttsAudioCtx
        const pcm16 = new Int16Array(buffer)
        const float32 = new Float32Array(pcm16.length)

        for(let i=0;i<pcm16.length;i++){
            float32[i] = pcm16[i]/0x8000
        }

        const aduioBuffer = audioCtx.createBuffer(1,float32.length,16000)
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
        wsRef.current.onmessage = async(event) => {
            console.log("WS received:", event.data?.constructor?.name)

            if(event.data instanceof ArrayBuffer) {
                console.log("Audio received, bytes:", event.data.byteLength)
                playAgentAudio(event.data)
                setAgentState("speaking")
                return
  }

            if(event.data instanceof Blob){
                const arrayBuffer = await event.data.arrayBuffer()
                playAgentAudio(arrayBuffer)
                setAgentState("speaking")
                return
            }
            const msg = JSON.parse(event.data)
            if(msg.type == "session_id"){
                setUserId(msg.userId)
            }
            if(msg.type == "metric"){
                setMetrics(prev => ({
                    ...prev,
                    [msg.name] : msg.data
                }))
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
    <div className='p-8 rounded-lg shadow-xl flex flex-col items-center bg-transparent border min-w-[55vw] min-h-[85vh]'>

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