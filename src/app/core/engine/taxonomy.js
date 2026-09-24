// Pure helpers for folder/tag taxonomy. No storage side-effects so they can be
// used and unit-tested without a database.

export function deriveFolders(docs) {
  const set = new Set()
  for (const d of docs || []) {
    if (d.folder) set.add(d.folder)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function deriveTags(docs) {
  const set = new Set()
  for (const d of docs || []) {
    for (const t of d.tags || []) set.add(t)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

/** Count documents per folder. @param {Array<{folder?: string|null}>} docs @returns {Map<string, number>} */
export function folderCounts(docs) {
  const map = new Map()
  for (const d of docs || []) {
    if (d.folder) map.set(d.folder, (map.get(d.folder) || 0) + 1)
  }
  return map
}

/** Union of folders derived from documents and folders the user created explicitly (persisted separately so empty folders survive). @param {string[]} derived @param {string[]} custom @returns {string[]} */
export function mergeFolders(derived, custom) {
  const set = new Set(custom || [])
  for (const f of derived || []) set.add(f)
  return [...set].sort((a, b) => a.localeCompare(b))
}
