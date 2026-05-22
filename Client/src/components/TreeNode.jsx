import React, { useState, useEffect } from 'react'
import './TreeNode.css'
import treeCache from '../utils/cache'

function TreeNode({ 
  node, 
  repo, 
  expanded, 
  loading,
  onToggle, 
  onLoadChildren,
  level = 0 
}) {
  const [children, setChildren] = useState([])
  const [hasChildren, setHasChildren] = useState(false)

  const nodeId = node.path
  const isExpanded = expanded.has(nodeId)
  const isLoading = loading.has(nodeId)
  const isFolder = node.type === 'tree'

  // Load children metadata
  useEffect(() => {
    if (isFolder) {
      // Check if we already cached this folder's children count
      const cached = treeCache.get(repo, node.path)
      if (cached && cached.contents) {
        setHasChildren(cached.contents.length > 0)
      }
    }
  }, [isFolder, repo, node.path])

  // Load children when expanded
  useEffect(() => {
    if (isExpanded && isFolder && children.length === 0) {
      loadChildrenData()
    }
  }, [isExpanded, isFolder])

  const loadChildrenData = async () => {
    try {
      const data = await onLoadChildren(repo, node.path)
      if (data && data.contents) {
        setChildren(data.contents)
        setHasChildren(data.contents.length > 0)
      }
    } catch (err) {
      console.error('Error loading children:', err)
    }
  }

  const handleToggle = async () => {
    onToggle(nodeId, node.path, isFolder)
    
    // If expanding and no children loaded yet, load them
    if (!isExpanded && isFolder && children.length === 0) {
      await loadChildrenData()
    }
  }

  const name = node.name || node.path.split('/').pop()

  return (
    <div className={`tree-node ${level === 0 ? 'root-level' : ''}`}>
      <div className="node-content" title={node.path}>
        {isFolder && (
          <button
            className={`toggle-btn ${isExpanded ? 'expanded' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={handleToggle}
            disabled={isLoading}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isLoading ? '⟳' : '▶'}
          </button>
        )}
        {!isFolder && <span className="toggle-placeholder" />}

        <span className="node-icon">
          {isFolder ? '📁' : '📄'}
        </span>

        <span className="node-name">{name}</span>

        {isLoading && <span className="loading-spinner">⟳</span>}
      </div>

      {isExpanded && isFolder && (
        <div className="node-children">
          {children.length > 0 ? (
            children.map(child => (
              <TreeNode
                key={child.path}
                node={child}
                repo={repo}
                expanded={expanded}
                loading={loading}
                onToggle={onToggle}
                onLoadChildren={onLoadChildren}
                level={level + 1}
              />
            ))
          ) : (
            <div className="empty-folder">📭 Empty folder</div>
          )}
        </div>
      )}
    </div>
  )
}

export default TreeNode
