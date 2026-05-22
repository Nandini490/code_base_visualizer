import React from "react"

export default function RepoSummary({ summary }) {
  if (!summary) {
    return (
      <section className="repo-summary">
        <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6 text-slate-200">
          <h2 className="text-lg font-semibold">Repository summary</h2>
          <p className="mt-2 text-sm text-slate-400">No summary available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="repo-summary">
      <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6 text-slate-200">
        <h2 className="text-lg font-semibold">Repository summary</h2>
        <p className="mt-2 text-sm text-slate-400">{summary.purpose || 'No description available.'}</p>
        <div className="mt-4 text-sm text-slate-300">
          <p><strong>Tech stack:</strong> {summary.techStack?.join(', ') || 'N/A'}</p>
          <p className="mt-2"><strong>Entry points:</strong> {summary.entryPoints?.join(', ') || 'N/A'}</p>
        </div>
      </div>
    </section>
  )
}
