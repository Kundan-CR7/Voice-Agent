import React from 'react'
import VoiceAgent from './components/VoiceAgent'
import Navbar from './components/Navbar'

const App = () => {
  return (
    <div className='min-h-screen bg-gray-900 text-white flex items-center justify-center'>
      {/* <Navbar></Navbar> */}
      <VoiceAgent/>
    </div>
  )
}

export default App