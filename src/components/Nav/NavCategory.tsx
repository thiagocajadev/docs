import cn from '@/lib/cn'
import Link from 'next/link'
import { ComponentProps } from 'react'
import { NavTreeNode, nodeFirstHref } from './buildNavTree'

export function NavCategory({
  node,
  asPath,
  depth,
}: {
  node: NavTreeNode
  asPath: string
  depth: number
}) {
  const currentUrl = `/${asPath}`
  const hasChildren = node.children.length > 0
  const href = node.doc?.url ?? node.indexDoc?.url ?? nodeFirstHref(node) ?? '#'
  const active = node.doc?.url === currentUrl || node.indexDoc?.url === currentUrl
  const isFolder = hasChildren || !!node.indexDoc

  return (
    <div className="text-sm">
      <NavItem
        href={href}
        depth={depth}
        active={active}
        className={cn(
          isFolder ? 'tracking-wide' : 'text-xs',
          isFolder && !node.label && 'capitalize',
          depth === 0 && isFolder && 'font-bold',
        )}
      >
        {node.label ?? node.name.replace(/-/g, ' ')}
      </NavItem>

      {hasChildren && (
        <ul>
          {node.children.map((child) => (
            <li key={child.name}>
              <NavCategory node={child} asPath={asPath} depth={depth + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NavItem({
  children,
  className,
  active,
  depth,
  style,
  ...props
}: { active?: boolean; depth: number } & ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      style={{ paddingLeft: `calc(2rem + ${depth} * 0.75rem)`, ...style }}
      className={cn(
        'block cursor-pointer p-3',
        active ? 'bg-primary-container' : 'bg-surface',
        className,
      )}
    >
      {children}
    </Link>
  )
}
