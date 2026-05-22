const EXTENSION_LANGUAGE_MAP = {
  js: 'JavaScript',
  jsx: 'React',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  json: 'JSON',
  md: 'Markdown',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  yaml: 'YAML',
  yml: 'YAML',
  mdx: 'Markdown',
  java: 'Java',
  py: 'Python',
  go: 'Go',
  rs: 'Rust',
  php: 'PHP',
  rb: 'Ruby',
  swift: 'Swift',
  cpp: 'C++',
  c: 'C',
  dockerfile: 'Docker',
  sh: 'Shell',
  bat: 'Batch',
  ps1: 'PowerShell'
}

const CONFIG_FILE_PATTERNS = [
  'package.json',
  'README.md',
  'README.MD',
  'README',
  'vite.config.js',
  'vite.config.ts',
  'webpack.config.js',
  'tsconfig.json',
  'jsconfig.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'dockerfile',
  '.github/workflows',
  'server/index.js',
  'src/main.jsx',
  'src/index.jsx',
  'src/index.js'
]

const getExtension = (path) => {
  const lower = path.toLowerCase()
  if (lower.endsWith('dockerfile')) {
    return 'dockerfile'
  }
  const parts = path.split('.').filter(Boolean)
  if (parts.length < 2) return ''
  return parts[parts.length - 1].toLowerCase()
}

const getLanguage = (path) => {
  const ext = getExtension(path)
  return EXTENSION_LANGUAGE_MAP[ext] || 'Other'
}

const getPathParts = (path) => path.split('/').filter(Boolean)

const countFolders = (tree) => {
  const folderPaths = new Set()
  tree.forEach((item) => {
    if (item.type === 'tree') {
      folderPaths.add(item.path)
    } else if (item.type === 'blob') {
      const parent = getPathParts(item.path).slice(0, -1).join('/')
      if (parent) {
        folderPaths.add(parent)
      }
    }
  })
  return folderPaths.size
}

const collectLanguages = (tree) => {
  const languageMap = new Map()

  tree.forEach((item) => {
    if (item.type !== 'blob') return
    const language = getLanguage(item.path)
    languageMap.set(language, (languageMap.get(language) || 0) + 1)
  })

  const sorted = Array.from(languageMap.entries())
    .filter(([lang]) => lang && lang !== 'Other')
    .sort((a, b) => b[1] - a[1])

  return sorted.map(([language, count]) => ({ language, count }))
}

const selectImportantFiles = (tree) => {
  const important = []
  const lowerPaths = tree.map((item) => item.path.toLowerCase())

  CONFIG_FILE_PATTERNS.forEach((pattern) => {
    const match = tree.find((item) => item.path.toLowerCase().endsWith(pattern.toLowerCase()))
    if (match) {
      important.push({ path: match.path, type: match.type })
    }
  })

  if (important.length === 0) {
    const defaults = ['package.json', 'README.md', 'src/index.js', 'src/main.jsx', 'server/index.js']
    defaults.forEach((name) => {
      const match = tree.find((item) => item.path.toLowerCase().endsWith(name.toLowerCase()))
      if (match) {
        important.push({ path: match.path, type: match.type })
      }
    })
  }

  return important.slice(0, 6)
}

const getEntryPoints = (tree) => {
  const candidates = [
    'src/main.jsx',
    'src/main.tsx',
    'src/index.jsx',
    'src/index.tsx',
    'src/index.js',
    'src/index.ts',
    'server/index.js',
    'index.js',
    'index.ts',
    'app.js',
    'app.ts'
  ]

  return candidates
    .map((candidate) => tree.find((item) => item.path.toLowerCase() === candidate.toLowerCase()))
    .filter(Boolean)
    .map((item) => item.path)
}

const getLargestModules = (tree) => {
  const moduleCounts = new Map()

  tree.forEach((item) => {
    if (item.type !== 'blob') return
    const parts = getPathParts(item.path)
    if (parts.length === 0) return
    const top = parts[0]
    moduleCounts.set(top, (moduleCounts.get(top) || 0) + 1)
  })

  return Array.from(moduleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([module, count]) => ({ module, fileCount: count }))
}

const inferArchitecture = (tree) => {
  const paths = tree.map((item) => item.path.toLowerCase())
  const hasFrontend = paths.some((path) => path.startsWith('src/') || path.includes('frontend') || path.includes('components'))
  const hasBackend = paths.some((path) => path.startsWith('server/') || path.includes('backend') || path.includes('api/') || path.includes('routes/'))
  const hasConfig = paths.some((path) => path.startsWith('.github/') || path.includes('config') || path.includes('webpack') || path.includes('vite.config'))
  const hasDocs = paths.some((path) => path.startsWith('readme') || path.endsWith('readme.md'))

  const nodes = []
  if (hasFrontend) nodes.push({ label: 'Frontend', description: 'UI / browser layer' })
  if (hasBackend) nodes.push({ label: 'Backend', description: 'API / server services' })
  if (!hasFrontend && !hasBackend) nodes.push({ label: 'Core', description: 'Repository code' })
  if (hasConfig) nodes.push({ label: 'Configs', description: 'Build and environment settings' })
  if (hasDocs) nodes.push({ label: 'Docs', description: 'Project docs and README' })

  const flow = []
  if (hasFrontend && hasBackend) {
    flow.push('Browser → Frontend → Backend')
  } else if (hasFrontend) {
    flow.push('Browser → Frontend')
  } else if (hasBackend) {
    flow.push('Client → Backend')
  } else {
    flow.push('Repository → Modules')
  }

  return {
    nodes,
    flow,
    detectedFrontend: hasFrontend,
    detectedBackend: hasBackend,
    hasConfig,
    hasDocs
  }
}

const buildTechStack = (languages, tree) => {
  const stack = new Set()
  const languageKeys = languages.map((item) => item.language)
  languageKeys.forEach((language) => {
    if (language === 'TypeScript') stack.add('TypeScript')
    if (language === 'JavaScript') stack.add('JavaScript')
    if (language === 'React') stack.add('React')
    if (language === 'HTML') stack.add('HTML')
    if (language === 'CSS') stack.add('CSS')
    if (language === 'JSON') stack.add('JSON')
    if (language === 'Markdown') stack.add('Documentation')
  })

  const pathSet = new Set(tree.map((item) => item.path.toLowerCase()))
  if (pathSet.has('vite.config.js') || pathSet.has('vite.config.ts')) stack.add('Vite')
  if (pathSet.has('webpack.config.js')) stack.add('Webpack')
  if (pathSet.has('package-lock.json')) stack.add('npm')
  if (pathSet.has('pnpm-lock.yaml')) stack.add('pnpm')
  if (pathSet.has('yarn.lock')) stack.add('Yarn')
  if (pathSet.has('dockerfile')) stack.add('Docker')

  return Array.from(stack)
}

export const analyzeRepository = (tree, rootContents = []) => {
  const fullTree = Array.isArray(tree) ? tree : []
  const files = fullTree.filter((item) => item.type === 'blob')
  const totalFiles = files.length
  const totalFolders = countFolders(fullTree)
  const languages = collectLanguages(fullTree)
  const topLanguages = languages.slice(0, 5)
  const importantFiles = selectImportantFiles(fullTree)
  const entryPoints = getEntryPoints(fullTree)
  const largestModules = getLargestModules(fullTree)
  const architecture = inferArchitecture(fullTree)
  const techStack = buildTechStack(languages, fullTree)

  const purpose = architecture.detectedFrontend && architecture.detectedBackend
    ? 'This repository appears to be a full-stack application with a dedicated frontend interface and backend services.'
    : architecture.detectedFrontend
      ? 'This repository looks like a frontend-first application built for browser-based interaction.'
      : architecture.detectedBackend
        ? 'This repository appears focused on backend services, APIs, or server-side logic.'
        : 'This repository contains code organized around shared modules and configuration files.'

  const architectureSummary = architecture.detectedFrontend && architecture.detectedBackend
    ? 'The project shows a split between frontend UI assets and backend routes or services, with a configuration layer for build tooling.'
    : architecture.detectedFrontend
      ? 'The repository primarily includes UI and static site modules, indicating a single-page or component-driven frontend.'
      : architecture.detectedBackend
        ? 'The repository primarily contains server and API endpoints, suggesting a backend-oriented architecture.'
        : 'The repository structure indicates a generic module graph with configuration and documentation support.'

  const importantPatterns = importantFiles.map((item) => item.path)

  return {
    purpose,
    techStack,
    architectureSummary,
    totalFiles,
    totalFolders,
    totalItems: fullTree.length,
    languages: topLanguages,
    languageBreakdown: languages,
    importantFiles,
    entryPoints,
    largestModules,
    architecture,
    importantPatterns,
    searchIndex: fullTree.map((item) => ({ path: item.path, type: item.type }))
  }
}
