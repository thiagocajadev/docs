import { Doc } from '@/app/[...slug]/DocsContext'
import type { NavGroup, NavItem } from '@/utils/navOrder'

export const INDEX_PAGE = 'introduction'

export type NavTreeNode = {
  name: string
  /** Display name, when the slug alone doesn't capitalize nicely (`sql` -> `SQL`) */
  label?: string
  doc?: Doc
  indexDoc?: Doc
  children: NavTreeNode[]
}

export type NavSection = {
  label?: string
  nodes: NavTreeNode[]
}

export function buildNavTree(docs: Doc[]): NavTreeNode[] {
  const root: NavTreeNode = { name: '', children: [] }

  for (const doc of docs) {
    const segments = doc.slug
    let parent = root

    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i]
      let folder = parent.children.find((c) => c.name === name && !c.doc)
      if (!folder) {
        folder = { name, children: [] }
        parent.children.push(folder)
      }
      parent = folder
    }

    const last = segments[segments.length - 1]
    if (last === INDEX_PAGE) {
      parent.indexDoc = doc
    } else {
      parent.children.push({ name: last, doc, children: [] })
    }
  }

  sortTree(root)
  return root.children
}

function isFolder(node: NavTreeNode): boolean {
  return node.children.length > 0 || !!node.indexDoc
}

function sortTree(node: NavTreeNode): void {
  node.children.sort((a, b) => {
    const af = isFolder(a) ? 1 : 0
    const bf = isFolder(b) ? 1 : 0
    return af - bf
  })
  for (const child of node.children) sortTree(child)
}

/**
 * Picks the listed nodes, in the order they were listed, and orders their children
 * recursively. Nodes that were not listed are left in `pool` for the caller.
 */
function takeOrdered(pool: Map<string, NavTreeNode>, items: NavItem[]): NavTreeNode[] {
  const nodes: NavTreeNode[] = []

  for (const item of items) {
    const node = pool.get(item.name)
    if (!node) continue

    pool.delete(item.name)
    nodes.push(node)

    if (item.children.length > 0) {
      const children = new Map(node.children.map((child) => [child.name, child]))
      node.children = [...takeOrdered(children, item.children), ...children.values()]
    }
  }

  return nodes
}

function applyLabels(nodes: NavTreeNode[], navLabels: Record<string, string>): void {
  for (const node of nodes) {
    const label = navLabels[node.name]
    if (label) node.label = label
    applyLabels(node.children, navLabels)
  }
}

/**
 * Groups the top level of the tree following `navOrder`. Entries left out of the
 * config keep their default order, after the ones that were listed.
 */
export function buildNavSections(
  docs: Doc[],
  navOrder: NavGroup[] = [],
  navLabels: Record<string, string> = {},
): NavSection[] {
  const tree = buildNavTree(docs)
  applyLabels(tree, navLabels)

  if (navOrder.length === 0) return [{ nodes: tree }]

  const pool = new Map(tree.map((node) => [node.name, node]))

  const sections: NavSection[] = []
  for (const { label, items } of navOrder) {
    const nodes = takeOrdered(pool, items)
    if (nodes.length > 0) sections.push({ label, nodes })
  }

  if (pool.size > 0) sections.push({ nodes: [...pool.values()] })

  return sections
}

export function flattenNavSections(sections: NavSection[]): Doc[] {
  return sections.flatMap(({ nodes }) => flattenNavTree(nodes))
}

export function flattenNavTree(tree: NavTreeNode[]): Doc[] {
  const out: Doc[] = []
  const visit = (node: NavTreeNode) => {
    if (node.indexDoc) out.push(node.indexDoc)
    if (node.doc) out.push(node.doc)
    for (const child of node.children) visit(child)
  }
  for (const node of tree) visit(node)
  return out
}

export function nodeContainsUrl(node: NavTreeNode, url: string): boolean {
  if (node.doc?.url === url) return true
  if (node.indexDoc?.url === url) return true
  return node.children.some((c) => nodeContainsUrl(c, url))
}

export function nodeFirstHref(node: NavTreeNode): string | undefined {
  if (node.indexDoc) return node.indexDoc.url
  if (node.doc) return node.doc.url
  for (const child of node.children) {
    const href = nodeFirstHref(child)
    if (href) return href
  }
  return undefined
}
