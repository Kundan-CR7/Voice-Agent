import React, { useEffect } from 'react'
import RMSGraph from './RMSGraph.jsx'
import MetricCard from './MetricCard.jsx'

const MetricDashboard = ({ rmsData, rmsThreshold, metrics = {} }) => {
    useEffect(() => {
        console.log("MetricDashboard rmsData length:", rmsData?.length)
    }, [rmsData])

    return (
        <section className="mt-6 p-6 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/5 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 tracking-wider uppercase">Live Metrics</h3>
            <RMSGraph
                data={rmsData}
                threshold={rmsThreshold}
            />
            <div className='grid grid-cols-2 gap-4 mt-6'>
                <MetricCard
                    title="VAD Detection"
                    value={metrics.vadLatency ?? "--"}
                    unit="ms"
                    subtitle="Silence → end of speech"
                    status="active"
                    tooltip="Time taken to detect the end of user speech (Voice Activity Detection)."
                />
                <MetricCard
                    title="STT Latency"
                    value={metrics.sttLatency ?? "--"}
                    unit="ms"
                    tooltip="Speech-to-Text: Time taken to transcribe audio to text."
                />

                <MetricCard
                    title="LLM Latency"
                    value={metrics.llmLatency ?? "--"}
                    unit="ms"
                    tooltip="Large Language Model: Total time for the AI to generate a complete response."
                />

                <MetricCard
                    title="LLM TTFT"
                    value={metrics.llmTTFT ?? "--"}
                    unit="ms"
                    tooltip="Time to First Token: Latency before the first word of the response is generated."
                />

                <MetricCard
                    title="TTS Latency"
                    value={metrics.ttsLatency ?? "--"}
                    unit="ms"
                    tooltip="Text-to-Speech: Time taken to convert the AI's text response back into audio."
                />

                <MetricCard
                    title="E2E Latency"
                    value={metrics.e2eLatency ?? "--"}
                    unit="ms"
                    status="warning"
                    tooltip="End-to-End: Total round-trip latency from when you stop speaking to when the agent starts speaking."
                />
            </div>
        </section>
    )
}

export default MetricDashboard