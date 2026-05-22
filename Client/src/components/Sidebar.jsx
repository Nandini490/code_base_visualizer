import React from "react"

export default function Sidebar({
  open,
  onToggle,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  summary,
  repo,
}) {
  return (
    <aside className="sidebar" style={{ minWidth: open ? '280px' : '72px' }}>
      <div className="sidebar-header">
        <button type="button" onClick={onToggle}>
          {open ? 'Collapse' : 'Open'}
        </button>
      </div>
      {open && (
        <div className="sidebar-body">
          <div className="sidebar-section">
            <h3>Repository</h3>
            <p>{repo || 'No repo loaded'}</p>
          </div>
          <div className="sidebar-section">
            <h3>Search</h3>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files"
            />
          </div>
          <div className="sidebar-section">
            <h3>Filters</h3>
            <button type="button" onClick={() => setFilterType('all')}>
              All
            </button>
            <button type="button" onClick={() => setFilterType('blob')}>
              Files
            </button>
            <button type="button" onClick={() => setFilterType('tree')}>
              Folders
            </button>
          </div>
          <div className="sidebar-section">
            <h3>Summary</h3>
            <p>Files: {summary?.totalFiles ?? 0}</p>
            <p>Folders: {summary?.totalFolders ?? 0}</p>
          </div>
        </div>
      )}
    </aside>
  )
}
