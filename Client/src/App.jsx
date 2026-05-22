import React, { useState } from 'react'
import RepoForm from './components/RepoForm'
import TreeView from './components/TreeView'
import DependencyGraph from './components/Graph/DependencyGraph'
import Sidebar from './components/Sidebar'
import RepoSummary from './components/RepoSummary'
import ArchitectureOverview from './components/ArchitectureOverview'
import { fetchRepoContents } from './utils/api'
import { analyzeRepository } from './utils/summary'
import './App.css'

const normalizeRepoInput = (value) => {
  if (!value || typeof value !== 'string') {
    return null
  }

  let repoValue = value.trim()
  if (repoValue.endsWith('/')) {
    repoValue = repoValue.slice(0, -1)
  }

  const githubUrl = repoValue.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/i)
  if (githubUrl) {
    repoValue = `${githubUrl[1]}/${githubUrl[2]}`
  }

  const parts = repoValue.split('/')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null
  }

  const repoName = parts[1].toLowerCase().endsWith('.git') ? parts[1].slice(0, -4) : parts[1]
  return `${parts[0]}/${repoName}`
}

function App() {
  const [repo, setRepo] = useState(null)
  const [rootContents, setRootContents] = useState([])
  const [repoTree, setRepoTree] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleFetchRepo = async (repoName) => {
    const normalizedRepo = normalizeRepoInput(repoName)
    if (!normalizedRepo) {
      setError('Invalid repository format. Use owner/repo.')
      return
    }

    setLoading(true)
    setError(null)
    setRepo(null)
    setRootContents([])
    setRepoTree([])
    setSummary(null)
    setSearchTerm('')

    try {
      const response = await fetchRepoContents(normalizedRepo, '/')
      const tree = response.tree || []
      const contents = response.contents || []

      setRepo(normalizedRepo)
      setRootContents(contents)
      setRepoTree(tree)
      setSummary(analyzeRepository(tree, contents))
    } catch (err) {
      setError(err.message || 'Error fetching repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>📊 Codebase Visualizer</h1>
          <p>Explore repository structure, dependencies, and architecture at a glance.</p>
        </div>
      </header>

      <div className="main-panel">
        <div className="top-panel">
          <RepoForm onFetch={handleFetchRepo} loading={loading} />
          {error && <div className="app-error">{error}</div>}
        </div>

        <div className="dashboard-grid">
          <Sidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen((value) => !value)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            summary={summary}
            repo={repo}
          />

          <div className="dashboard-content">
            {loading && (
              <div className="loading-panel">
                <div className="loading-spinner-large" />
                <p>Loading repository insights...</p>
              </div>
            )}

            {!loading && repo && (
              <>
                <div className="overview-grid">
                  <RepoSummary summary={summary} />
                  <ArchitectureOverview architecture={summary?.architecture} />
                </div>

                <div className="visualization-grid">
                  <section className="panel panel-tree">
                    <div className="panel-header">
                      <h2>Repository explorer</h2>
                      <span>Browse files and folders with search</span>
                    </div>
                    <TreeView
                      repo={repo}
                      initialContents={rootContents}
                      repoTree={repoTree}
                      searchTerm={searchTerm}
                      filterType={filterType}
                    />
                  </section>

                  <section className="panel panel-graph">
                    <div className="panel-header">
                      <h2>Dependency graph</h2>
                      <span>Visual file/module relationships</span>
                    </div>
                    <DependencyGraph
                      files={repoTree}
                      repo={repo}
                      loading={loading}
                      searchTerm={searchTerm}
                      importantFiles={summary?.importantFiles || []}
                    />
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
