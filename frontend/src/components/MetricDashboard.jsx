import React, { useEffect } from 'react'
import RMSGraph from './RMSGraph'

const MetricDashboard = ({rmsData,rmsThreshold}) => {
    useEffect(() => {
        console.log("MetricDashboard rmsData length:",rmsData?.length)
    },[rmsData])
    
    return(
        <section className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Audio Metrics
            </h3>

            <RMSGraph
                data={rmsData}
                threshold={rmsThreshold}
            />
        </section>
    )
}

export default MetricDashboard