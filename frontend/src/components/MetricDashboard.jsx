import React, { useEffect } from 'react'
import RMSGraph from './RMSGraph'
import MetricCard from './MetricCard'

const MetricDashboard = ({rmsData,rmsThreshold,metrics={}}) => {
    useEffect(() => {
        console.log("MetricDashboard rmsData length:",rmsData?.length)
    },[rmsData])
    
    return(
        <section className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10">
            <RMSGraph
                data={rmsData}
                threshold={rmsThreshold}
            />
            <div className='grid grid-cols-2 gap-5 mt-4'>
            <MetricCard
                title="VAD Detection"
                value={metrics.vadLatency?? "--"}
                unit="ms"
                subtitle="Silence → end of speech"
                status="active"
            />
            <MetricCard
                title="STT Latency"
                value={metrics.sttLatency?? "--"}
                unit="ms"
            />

            <MetricCard
                title="LLM Latency"
                value={metrics.llmLatency?? "--"}
                unit="ms"
            />

            <MetricCard
                title="LLM TTFT"
                value={metrics.llmTTFT ?? "--"}
                unit="ms"
            />

            <MetricCard
                title="TTS Latency"
                value={metrics.ttsLatency?? "--"}
                unit="ms"
            />

            <MetricCard
                title="E2E Latency"
                value={metrics.e2eLatency?? "--"}
                unit="ms"
                status="warning"
            />
            </div>
        </section>
    )
}

export default MetricDashboard