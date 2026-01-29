import {TavilyClient} from "tavily"

const tavily = new TavilyClient({
    apiKey : process.env.TAVILY_API_KEY
})

export async function webSearch(query) {
    const res = await tavily.search({
        query,
        search_depth : "basic",
        max_results : 3
    })
    console.log("Tavily response: ",res)
    return {
        answer: res.answer,
        results: res.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        })),
        responseTime: res.response_time,
    };
}