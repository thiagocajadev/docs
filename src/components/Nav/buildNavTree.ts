import { Doc } from '@/app/[...slug]/DocsContext'

export const INDEX_PAGE = 'introduction'

export type NavTreeNode = {
  name: string
  doc?: Doc
  indexDoc?: Doc
  children: NavTreeNode[]
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

  return root.children
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
