export function calculateRMS(float32Array){
    let sum = 0;
    let len = float32Array.length
    for(let i=0;i<len;i++){
        sum += float32Array[i]*float32Array[i]
    }
    return Math.sqrt(sum/len)
}