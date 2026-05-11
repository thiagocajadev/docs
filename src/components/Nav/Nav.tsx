import { Doc } from '@/app/[...slug]/DocsContext'
import cn from '@/lib/cn'
import * as React from 'react'
import { buildNavTree } from './buildNavTree'
import { NavCategory } from './NavCategory'
import { NavCategoryCollapsible } from './NavCategoryCollapsible'

export function Nav({
  className,
  docs,
  asPath,
  collapsible = true,
}: React.ComponentProps<'ul'> & {
  docs: Doc[]
  asPath: string
  collapsible: boolean
}) {
  const tree = React.useMemo(() => buildNavTree(docs), [docs])

  return (
    <ul className={cn(className, '')}>
      {tree.map((node) => (
        <li key={node.name}>
          {collapsible ? (
            <NavCategoryCollapsible node={node} asPath={asPath} depth={0} />
          ) : (
            <NavCategory node={node} asPath={asPath} depth={0} />
          )}
        </li>
      ))}
    </ul>
  )
}
