const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function getLLMResponse(userText,systemPrompt){

    const startTime = Date.now()
    let ttft = null
    let fullText = ""
    let buffer = ""

    const response = await fetch(OPENROUTER_URL,{
        method : "POST",
        headers : {
            "Authorization" : `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({
            model : "mistralai/mistral-7b-instruct",
            stream: true,
            messages : [
                {
                    role : "system",
                    content : systemPrompt || "You are a concise, friendly AI voice assistant. Keep response short and natural for speech."
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
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while(true){
        const {value,done} = await reader.read()
        if(done){
            break
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n")
        buffer = lines.pop()

        for(const line of lines){
            if (!line.startsWith("data: ")) continue;
            if(line.includes("[DONE]")) continue

            try{
                const json = JSON.parse(line.replace("data: ", ""));
                const token = json.choices?.[0]?.delta?.content;
    
                if(token){
                    if(!ttft){
                        ttft = Date.now() - startTime
                    }
                    fullText += token
                }
            }catch(err){
                console.warn("Skipping partial JSON chunk");
            }

        }
    }
    const totalLatency = Date.now() - startTime;
    return {
        text : fullText.trim(),
        metrics : {
            ttft,totalLatency
        }
    }
}