import React, { useState } from 'react'
import VoiceAgent from './components/VoiceAgent'
import Navbar from './components/Navbar'
import MetricDashboard from './components/MetricDashboard'

const App = () => {
  const [rmsData,setRmsData] = useState([])
  const RMS_THRESHOLD = 0.04
  const [metrics, setMetrics] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  return (
    <div className='min-h-screen bg-slate-950 text-white flex flex-col items-center pt-24 overflow-hidden'>
      <Navbar isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen} />
      <div className={`flex justify-center transition-all duration-500 ease-in-out w-full px-8 gap-8 ${isFullScreen ? 'h-[90vh]' : ''}`}>

        {/* Metrics Panel - Hidden in Full Screen */}
        <div id="metrics-panel" className={`transition-all duration-500 ease-in-out overflow-hidden ${isFullScreen ? 'w-0 opacity-0' : 'w-[450px] opacity-100'}`}>
          <MetricDashboard rmsData={rmsData} rmsThreshold={RMS_THRESHOLD} metrics={metrics} />
        </div>

        {/* Voice Agent - Expands in Full Screen */}
        <div id="voice-agent" className={`transition-all duration-500 ease-in-out ${isFullScreen ? 'flex-1 max-w-5xl' : 'w-[60vw]'}`}>
          <VoiceAgent setRmsData={setRmsData} setMetrics={setMetrics} isFullScreen={isFullScreen} />
        </div>
      </div>
    </div>
  )
}

export default App