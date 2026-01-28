import React, { useState } from 'react'
import VoiceAgent from './components/VoiceAgent'
import Navbar from './components/Navbar'
import MetricDashboard from './components/MetricDashboard'

const App = () => {
  const [rmsData,setRmsData] = useState([])
  const RMS_THRESHOLD = 0.04
  const [metrics, setMetrics] = useState({});
  
  return (
    <div className='min-h-screen bg-[#11172e] text-white flex flex-col items-center pt-32'>
      <Navbar/>
      <div className='flex justify-between'>
        <MetricDashboard rmsData={rmsData} rmsThreshold={RMS_THRESHOLD} metrics={metrics}/>
        <VoiceAgent setRmsData={setRmsData} setMetrics={setMetrics}/>
      </div>
    </div>
  )
}

export default App