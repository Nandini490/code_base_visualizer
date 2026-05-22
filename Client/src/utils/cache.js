// Simple cache manager for folder contents
class TreeCache {
  constructor() {
    this.cache = new Map();
  }

  getKey(repo, path) {
    return `${repo}:${path}`;
  }

  get(repo, path) {
    return this.cache.get(this.getKey(repo, path));
  }

  set(repo, path, data) {
    this.cache.set(this.getKey(repo, path), data);
  }

  has(repo, path) {
    return this.cache.has(this.getKey(repo, path));
  }

  clear() {
    this.cache.clear();
  }
}

export default new TreeCache();
