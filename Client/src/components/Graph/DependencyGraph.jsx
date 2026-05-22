import React, { useEffect, useMemo } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { RefreshCw } from 'lucide-react'
import './DependencyGraph.css'

const MAX_GRAPH_NODES = 200

const getNodeType = (item, importantSet, query) => {
  const isFolder = item.type === 'tree'
  const isImportant = importantSet.has(item.path)
  const isMatch = query && item.path.toLowerCase().includes(query)

  let className = isFolder ? 'folder-node' : 'file-node'
  if (isImportant) className += ' selected'
  if (isMatch) className += ' matched'
  return className
}

const buildNodePosition = (depth, index, groupCount) => ({
  x: depth * 200,
  y: index * 90 + (groupCount * 16),
})

const buildNodes = (fileList, repo, importantSet, query) => {
  const nodeMap = new Map()
  const grouped = new Map()

  nodeMap.set('root', {
    id: 'root',
    data: { label: `📦 ${repo || 'Repository'}` },
    position: { x: 0, y: 0 },
    className: 'folder-node selected',
  })

  const shortlist = fileList
    .filter((item) => item.path && item.path.length > 0)
    .slice(0, MAX_GRAPH_NODES)

  shortlist.forEach((item, index) => {
    const parts = item.path.split('/')
    const depth = parts.length - 1
    const parentId = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root'

    if (!grouped.has(depth)) grouped.set(depth, [])
    grouped.get(depth).push(item)

    for (let i = 0; i < parts.length - 1; i += 1) {
      const parentPath = parts.slice(0, i + 1).join('/')
      if (!nodeMap.has(parentPath)) {
        nodeMap.set(parentPath, {
          id: parentPath,
          data: { label: `📁 ${parts[i]}` },
          position: { x: i * 200, y: i * 100 + 60 },
          className: 'folder-node',
        })
      }
    }

    const position = buildNodePosition(depth, index, grouped.get(depth).length)
    nodeMap.set(item.path, {
      id: item.path,
      data: { label: item.type === 'tree' ? `📁 ${parts[parts.length - 1]}` : `📄 ${parts[parts.length - 1]}` },
      position,
      className: getNodeType(item, importantSet, query),
    })
  })

  return Array.from(nodeMap.values())
}

const buildEdges = (fileList) => {
  const edges = []

  fileList.slice(0, MAX_GRAPH_NODES).forEach((file) => {
    const parts = file.path.split('/')
    if (parts.length > 1) {
      const parentId = parts.length === 2 ? 'root' : parts.slice(0, -1).join('/')
      edges.push({
        id: `${parentId}-${file.path}`,
        source: parentId,
        target: file.path,
        animated: false,
        style: { stroke: 'var(--border-primary)', strokeWidth: 1 },
      })
    }
  })

  return edges
}

export default function DependencyGraph({
  files = [],
  loading = false,
  repo = '',
  searchTerm = '',
  importantFiles = [],
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [filterType, setFilterType] = React.useState('all')

  const normalizedQuery = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm])
  const importantSet = useMemo(
    () => new Set(importantFiles.map((item) => item.path)),
    [importantFiles],
  )

  const filteredFiles = useMemo(() => {
    if (!files || files.length === 0) return []
    return files.filter((file) => {
      if (filterType === 'folder') return file.type === 'tree'
      if (filterType === 'file') return file.type === 'blob'
      return true
    })
  }, [files, filterType])

  useEffect(() => {
    if (!filteredFiles || filteredFiles.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    setNodes(buildNodes(filteredFiles, repo, importantSet, normalizedQuery))
    setEdges(buildEdges(filteredFiles))
  }, [filteredFiles, repo, importantSet, normalizedQuery, setNodes, setEdges])

  const handleFilterChange = (type) => {
    setFilterType((current) => (current === type ? 'all' : type))
  }

  if (loading) {
    return (
      <div className="dependency-graph">
        <div className="dependency-graph-header">
          <h3 className="dependency-graph-title">📊 Dependency Graph</h3>
        </div>
        <div className="dependency-graph-loading">
          <p>Loading graph...</p>
        </div>
      </div>
    )
  }

  if (!files || files.length === 0) {
    return (
      <div className="dependency-graph">
        <div className="dependency-graph-header">
          <h3 className="dependency-graph-title">📊 Dependency Graph</h3>
        </div>
        <div className="dependency-graph-empty">
          <div className="dependency-graph-empty-icon">🔗</div>
          <p>No files to visualize</p>
          <p style={{ fontSize: 'var(--text-xs)' }}>
            Load a repository to see the dependency graph
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dependency-graph">
      <div className="dependency-graph-header">
        <h3 className="dependency-graph-title">📊 Dependency Graph</h3>
        <div className="dependency-graph-controls">
          <div className="dependency-graph-filter">
            <button
              className={`dependency-graph-filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button
              className={`dependency-graph-filter-btn ${filterType === 'folder' ? 'active' : ''}`}
              onClick={() => handleFilterChange('folder')}
            >
              📁 Folders
            </button>
            <button
              className={`dependency-graph-filter-btn ${filterType === 'file' ? 'active' : ''}`}
              onClick={() => handleFilterChange('file')}
            >
              📄 Files
            </button>
          </div>
          <button className="dependency-graph-btn" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      <div className="dependency-graph-body">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
        >
          <Background color="var(--border-secondary)" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.className?.includes('folder')) return 'rgba(88, 166, 255, 0.45)'
              if (node.className?.includes('file')) return 'rgba(160, 174, 192, 0.45)'
              return 'rgba(200, 200, 200, 0.45)'
            }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: '6px',
            }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
