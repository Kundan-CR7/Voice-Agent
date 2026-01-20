export function noiseSuppression(audioData){
    const threshold = 0.01
    const output = new Float32Array(audioData.length)
    for(let i=0;i<audioData.length;i++){
        output[i] = Math.abs(audioData[i]) > threshold ? audioData[i] : 0
    }
}