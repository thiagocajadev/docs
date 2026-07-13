import { parse } from 'yaml'

/**
 * An entry of the sidebar: a folder or page name, plus the order of its own children.
 */
export type NavItem = {
  name: string
  children: NavItem[]
}

/**
 * A sidebar section: an optional label followed by the entries it contains.
 */
export type NavGroup = {
  label?: string
  items: NavItem[]
}

function normalize(name: string): string {
  return name
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
}

/**
 * Accepts a YAML list, a nested `folder: [children]` mapping, or a plain
 * "a b c" / "a, b, c" string.
 */
function toItems(value: unknown): NavItem[] {
  if (typeof value === 'string') {
    return value
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((name) => ({ name: normalize(name), children: [] }))
  }

  if (Array.isArray(value)) return value.flatMap(toItems)

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).map(([name, children]) => ({
      name: normalize(name),
      children: toItems(children),
    }))
  }

  return []
}

/**
 * Parses the NAV_ORDER config, which orders the sidebar and, optionally, splits
 * its top level into labelled groups. Anything left out keeps the default order,
 * after the entries that were listed.
 *
 * Flat:
 *   javascript csharp sql
 *
 * Grouped, with nested folders:
 *   Programação:
 *     - javascript:
 *         - setup
 *         - conventions
 *     - csharp
 *   Banco de Dados: sql
 */
export function parseNavOrder(source?: string): NavGroup[] {
  if (!source?.trim()) return []

  let data: unknown
  try {
    data = parse(source)
  } catch (error) {
    console.warn(`NAV_ORDER: ignored, invalid YAML (${(error as Error).message})`)
    return []
  }

  // At the top level a mapping declares groups; anywhere else it declares nesting.
  const groups: NavGroup[] =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? Object.entries(data).map(([label, value]) => ({ label, items: toItems(value) }))
      : [{ items: toItems(data) }]

  return groups.filter(({ items }) => items.length > 0)
}

/**
 * Display names for folders/pages whose slug doesn't capitalize nicely, keyed by slug:
 *
 *   sql: SQL
 *   csharp: C#
 */
export function parseNavLabels(source?: string): Record<string, string> {
  if (!source?.trim()) return {}

  let data: unknown
  try {
    data = parse(source)
  } catch (error) {
    console.warn(`NAV_LABELS: ignored, invalid YAML (${(error as Error).message})`)
    return {}
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    console.warn('NAV_LABELS: ignored, expected a `slug: Label` mapping')
    return {}
  }

  return Object.fromEntries(
    Object.entries(data)
      .filter(([, label]) => typeof label === 'string' && label.length > 0)
      .map(([name, label]) => [normalize(name), String(label)]),
  )
}
