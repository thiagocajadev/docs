'use client'

import cn from '@/lib/cn'
import * as Collapsible from '@radix-ui/react-collapsible'
import Link from 'next/link'
import { ComponentProps, useEffect, useState } from 'react'
import { IoIosArrowDown } from 'react-icons/io'
import { NavTreeNode, nodeContainsUrl, nodeFirstHref } from './buildNavTree'

export function NavCategoryCollapsible({
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
  const containsCurrent = nodeContainsUrl(node, currentUrl)

  const [open, setOpen] = useState(containsCurrent)

  useEffect(() => {
    if (containsCurrent) setOpen(true)
  }, [containsCurrent])

  useEffect(() => {
    const dur = '.2s'
    document.documentElement.style.setProperty('--collapsible-down-duration', dur)
    document.documentElement.style.setProperty('--collapsible-up-duration', dur)
  }, [])

  const isFolder = hasChildren || !!node.indexDoc

  const label = (
    <NavItem
      href={href}
      depth={depth}
      active={active}
      onClick={hasChildren ? () => setOpen(true) : undefined}
      className={cn(
        isFolder ? 'tracking-wide' : 'text-xs',
        isFolder && !node.label && 'capitalize',
        depth === 0 && isFolder && 'font-semibold',
      )}
    >
      {node.label ?? formatName(node.name)}
    </NavItem>
  )

  if (!hasChildren) {
    return <div className="text-sm [--NavItem-pad:.75rem]">{label}</div>
  }

  return (
    <Collapsible.Root
      className={cn('text-sm [--NavItem-pad:.75rem] [--arrow-size:--spacing(4)]')}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="relative">
        {label}
        <Collapsible.Trigger
          asChild
          className={cn('absolute right-0 top-1/2 transition-transform', open && 'rotate-90')}
        >
          <div className="-translate-y-1/2 p-(--NavItem-pad)">
            <IoIosArrowDown className="size-(--arrow-size) -rotate-90" />
          </div>
        </Collapsible.Trigger>
      </div>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul>
          {node.children.map((child) => (
            <li key={child.name}>
              <NavCategoryCollapsible node={child} asPath={asPath} depth={depth + 1} />
            </li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

function formatName(name: string): string {
  return name.replace(/-/g, ' ')
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
      style={{ paddingLeft: `calc(var(--rgrid-m) + ${depth} * 0.75rem)`, ...style }}
      className={cn(
        'block cursor-pointer rounded-r-xl p-(--NavItem-pad) pr-[calc(2*var(--NavItem-pad)+var(--arrow-size))]',
        active ? 'bg-primary-container' : 'bg-surface',
        className,
      )}
    >
      {children}
    </Link>
  )
}
