import React, { useState } from 'react'
import './RepoForm.css'

function RepoForm({ onFetch, loading }) {
  const [repo, setRepo] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (repo.trim()) {
      onFetch(repo.trim())
      setRepo('')
    }
  }

  return (
    <form className="repo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter repository owner/repo"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
        disabled={loading}
        className="repo-input"
      />
      <button type="submit" disabled={loading} className="repo-button">
        {loading ? 'Loading...' : 'Visualize'}
      </button>
    </form>
  )
}

export default RepoForm
