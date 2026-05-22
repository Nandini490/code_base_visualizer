import React from "react"

export default function ArchitectureOverview({ architecture }) {
  if (!architecture) {
    return (
      <section className="architecture-overview">
        <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6 text-slate-200">
          <h2 className="text-lg font-semibold">Architecture overview</h2>
          <p className="mt-2 text-sm text-slate-400">No architecture data available.</p>
        </div>
      </section>
    )
  }

  const flow = architecture.flow || []
  const nodes = architecture.nodes || []

  return (
    <section className="architecture-overview">
      <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6 text-slate-200">
        <h2 className="text-lg font-semibold">Architecture overview</h2>
        <p className="mt-2 text-sm text-slate-400">Detected system flow and modules.</p>

        <div className="mt-6 space-y-4">
          {flow.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {flow.map((step, index) => (
                <span key={`step-${index}`} className="rounded-full bg-slate-950/70 px-4 py-2 text-sm text-sky-200">
                  {step}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/70 p-4 text-slate-400">No architecture flow detected.</div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {nodes.length > 0 ? (
              nodes.map((node, index) => (
                <div key={`node-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="font-semibold text-slate-100">{node.label}</p>
                  <p className="mt-2 text-sm text-slate-400">{node.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-500">
                No architecture nodes found.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
