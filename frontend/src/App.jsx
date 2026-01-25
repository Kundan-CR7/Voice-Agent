import React from 'react'
import VoiceAgent from './components/VoiceAgent'
import Navbar from './components/Navbar'

const App = () => {
  return (
    <div className='min-h-screen bg-[#11172e] text-white flex flex-col items-center pt-32'>
      <Navbar/>
      <div className='flex justify-end'>
        <div className='min-w-[40vw] border'>Metric Dashboard</div>
        <VoiceAgent/>
      </div>
    </div>
  )
}

export default App