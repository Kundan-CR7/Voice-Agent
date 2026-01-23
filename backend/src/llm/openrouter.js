const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function getLLMResponse(userText){
    const response = await fetch(OPENROUTER_URL,{
        method : "POST",
        headers : {
            "Authorization" : `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({
            model : "mistralai/mistral-7b-instruct",
            messages : [
                {
                    role : "system",
                    content : "You are a concise, friendly AI voice assistant. Keep response short and natural for speech."
                },
                {
                    role : "user",
                    content : userText
                }
            ],
            temperature : 0.7,
            max_tokens : 150
        })
    })
    const data = await response.json()

    if(!data.choices || !data.choices[0]){
        console.error("OpenRouter error:", data)
        return "Sorry, I had trouble responding."; 
    }
    return data.choices[0].message.content
}