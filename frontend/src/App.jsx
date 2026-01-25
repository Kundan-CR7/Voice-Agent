import React from 'react'
import VoiceAgent from './components/VoiceAgent'
import Navbar from './components/Navbar'

const App = () => {
  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center pt-32'>
      <Navbar/>
      <VoiceAgent/>
    </div>
  )
}

export default App