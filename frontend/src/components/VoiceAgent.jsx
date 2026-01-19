import {useEffect,useState,useRef} from 'react'

const VoiceAgent = () => {
    const [userId,setUserId] = useState(null)
    const [status,setStatus] = useState("disconnected")
    const wsRef = useRef(null)

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
    })

  return (
    <div className='bg-gray-800 p-8 rounded-lg shadow-xl'>
        <h1 className='text-2xl font-bold mb-4'>Voice Agent</h1>
        <div className='space-y-2'>
            <p>Status: <span className={status=="connected"? "text-green-400" : "text-red-400" }>{status}</span></p>
            <p>User ID: <><span className='text-blue-400'>{userId || "Waiting"}</span></> </p>
        </div>
    </div>
  )
}

export default VoiceAgent