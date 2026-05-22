import React, { useState, useEffect, useMemo } from 'react'
import TreeNode from './TreeNode'
import { fetchRepoContents } from '../utils/api'
import treeCache from '../utils/cache'
import './TreeView.css'

function TreeView({ repo, initialContents = [], repoTree = [], searchTerm = '', filterType = 'all' }) {
  const [contents, setContents] = useState(initialContents)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [loadingNodes, setLoadingNodes] = useState(new Set())
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ files: 0, dirs: 0 })

  useEffect(() => {
    if (!repo) return

    if (initialContents && initialContents.length > 0) {
      setContents(initialContents)
      setStats({
        files: initialContents.filter((item) => item.type !== 'tree').length,
        dirs: initialContents.filter((item) => item.type === 'tree').length,
      })
      return
    }

    loadDirectory(repo, '/')
  }, [repo, initialContents])

  const loadDirectory = async (repoName, path) => {
    if (treeCache.has(repoName, path)) {
      const cachedData = treeCache.get(repoName, path)
      if (path === '/') {
        setContents(cachedData.contents)
        setStats({
          files: cachedData.contents.filter((item) => item.type !== 'tree').length,
          dirs: cachedData.contents.filter((item) => item.type === 'tree').length,
        })
      }
      return cachedData
    }

    setLoadingNodes((prev) => new Set(prev).add(path))

    try {
      const data = await fetchRepoContents(repoName, path)
      treeCache.set(repoName, path, data)

      if (path === '/') {
        setContents(data.contents)
        setStats({
          files: data.contents.filter((item) => item.type !== 'tree').length,
          dirs: data.contents.filter((item) => item.type === 'tree').length,
        })
      }
      setError(null)
      return data
    } catch (err) {
      setError(err.message)
      console.error('Error loading directory:', err)
    } finally {
      setLoadingNodes((prev) => {
        const next = new Set(prev)
        next.delete(path)
        return next
      })
    }
  }

  const normalizedQuery = searchTerm.trim().toLowerCase()

  const searchResults = useMemo(() => {
    if (!normalizedQuery || !repoTree.length) {
      return []
    }

    return repoTree
      .filter((item) => {
        const text = item.path.toLowerCase()
        const term = normalizedQuery
        if (!text.includes(term)) {
          return false
        }
        if (filterType === 'blob') {
          return item.type === 'blob'
        }
        if (filterType === 'tree') {
          return item.type === 'tree'
        }
        return true
      })
      .slice(0, 150)
  }, [normalizedQuery, repoTree, filterType])

  const handleToggle = async (nodeId, path, isFolder) => {
    const newExpanded = new Set(expandedNodes)

    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
      if (isFolder) {
        await loadDirectory(repo, path)
      }
    }

    setExpandedNodes(newExpanded)
  }

  return (
    <div className="tree-view">
      <div className="tree-stats">
        <span>📁 Directories: {stats.dirs}</span>
        <span>📄 Files: {stats.files}</span>
        {normalizedQuery && <span>🔎 Search results: {searchResults.length}</span>}
      </div>

      {error && <div className="tree-error">⚠️ {error}</div>}

      <div className="tree-container">
        <div className="tree-root">
          <div className="root-header">📦 {repo}</div>

          {normalizedQuery ? (
            <div className="search-results">
              {searchResults.length ? (
                searchResults.map((item) => (
                  <div key={item.path} className="search-result-item">
                    <span className="search-icon">{item.type === 'tree' ? '📁' : '📄'}</span>
                    <span className="search-path">{item.path}</span>
                  </div>
                ))
              ) : (
                <div className="search-empty">No matching files or folders found.</div>
              )}
            </div>
          ) : (
            <div className="tree-items">
              {contents.map((item) => (
                <TreeNode
                  key={item.path}
                  node={item}
                  repo={repo}
                  expanded={expandedNodes}
                  loading={loadingNodes}
                  onToggle={handleToggle}
                  onLoadChildren={loadDirectory}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TreeView

