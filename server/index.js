const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.send("Codebase Visualizer Backend Running 🚀");
});

// Helper: Get directory path from tree
const getDirectoryContents = (tree, dirPath) => {
  if (!dirPath || dirPath === "/") {
    // Return root level items
    return tree
      .filter(item => !item.path.includes("/"))
      .map(item => ({
        path: item.path,
        type: item.type,
        name: item.path.split("/").pop()
      }));
  }

  // Return items that are direct children of the directory
  const prefix = dirPath.endsWith("/") ? dirPath : dirPath + "/";
  const items = tree.filter(item => item.path.startsWith(prefix));

  const directChildren = new Map();
  
  items.forEach(item => {
    const relativePath = item.path.slice(prefix.length);
    const parts = relativePath.split("/");
    const name = parts[0];

    if (!directChildren.has(name)) {
      const isFile = parts.length === 1 && item.type === "blob";
      directChildren.set(name, {
        path: prefix + name,
        type: isFile ? "blob" : "tree",
        name: name
      });
    }
  });

  return Array.from(directChildren.values());
};

const parseRepoInput = (value) => {
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
  return {
    owner: parts[0],
    repo: repoName,
    fullName: `${parts[0]}/${repoName}`,
  }
}

// 🔥 GitHub repo fetch route
app.post('/repo', async (req, res) => {
  const { repo, path = '/' } = req.body; // format: "owner/repo"
  const parsed = parseRepoInput(repo)

  if (!parsed) {
    return res.status(400).json({ error: 'Invalid repository format. Use owner/repo.' })
  }

  try {
    const repoUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`
    const repoResponse = await axios.get(repoUrl, {
      headers: {
        'User-Agent': 'Codebase-Visualizer',
        Accept: 'application/vnd.github+json',
      },
      timeout: 15000,
    })

    if (repoResponse.data.private) {
      return res.status(403).json({ error: 'Repository is private. Public repositories only.' })
    }

    const defaultBranch = repoResponse.data.default_branch || 'main'
    const treeUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${defaultBranch}?recursive=1`
    const treeResponse = await axios.get(treeUrl, {
      headers: {
        'User-Agent': 'Codebase-Visualizer',
        Accept: 'application/vnd.github+json',
      },
      timeout: 30000,
    })

    const tree = Array.isArray(treeResponse.data.tree) ? treeResponse.data.tree : []
    const contents = getDirectoryContents(tree, path)

    return res.json({
      path,
      contents,
      totalItems: tree.length,
      tree,
    })
  } catch (error) {
    console.error('Error fetching repo:', error.message)

    let status = error.response?.status || 500
    let errorMsg = 'Failed to fetch repo.'

    if (error.code === 'ECONNABORTED') {
      status = 504
      errorMsg = 'Request timeout. Repository might be too large or the network is slow.'
    } else if (error.response?.status === 404) {
      errorMsg = 'Repository not found or private. Check the owner/repo value.'
    } else if (error.response?.status === 403) {
      const message = (error.response.data && error.response.data.message) || ''
      if (message.toLowerCase().includes('rate limit')) {
        status = 429
        errorMsg = 'GitHub API rate limit exceeded. Please wait and try again.'
      } else {
        errorMsg = 'Access denied. The repository may be private or unavailable.'
      }
    }

    return res.status(status).json({ error: errorMsg })
  }
})

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});