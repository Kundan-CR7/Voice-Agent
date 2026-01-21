export function calculateRMS(float32Array){
    let sum = 0;
    let len = float32Array.length
    for(let i=0;i<len;i++){
        sum += float32Array[i]*float32Array[i]
    }
    return Math.sqrt(sum/len)
}

export const createWavBuffer = (float32Array) => {
    const numChannels = 1
    const sampleRate = 16000
    const bytesPerSample = 2
    const dataSize = float32Array.length * bytesPerSample
    const bufferSize = 44 + dataSize

    const buffer = Buffer.alloc(bufferSize)
    let offset = 0

    // RIFF header
    buffer.write('RIFF', offset); 
    offset += 4
    buffer.writeUInt32LE(bufferSize - 8, offset); 
    offset += 4
    buffer.write('WAVE', offset); 
    offset += 4

    // fmt chunk
    buffer.write('fmt ', offset); 
    offset += 4
    buffer.writeUInt32LE(16, offset); 
    offset += 4
    buffer.writeUInt16LE(1, offset); 
    offset += 2
    buffer.writeUInt16LE(numChannels, offset); 
    offset += 2
    buffer.writeUInt32LE(sampleRate, offset); 
    offset += 4
    buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, offset); 
    offset += 4
    buffer.writeUInt16LE(numChannels * bytesPerSample, offset); 
    offset += 2
    buffer.writeUInt16LE(16, offset); 
    offset += 2
}