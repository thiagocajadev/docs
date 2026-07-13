import { Doc } from '@/app/[...slug]/DocsContext'
import cn from '@/lib/cn'
import type { NavGroup } from '@/utils/navOrder'
import * as React from 'react'
import { buildNavSections } from './buildNavTree'
import { NavCategory } from './NavCategory'
import { NavCategoryCollapsible } from './NavCategoryCollapsible'

export function Nav({
  className,
  docs,
  asPath,
  collapsible = true,
  navOrder,
  navLabels,
}: React.ComponentProps<'div'> & {
  docs: Doc[]
  asPath: string
  collapsible: boolean
  navOrder?: NavGroup[]
  navLabels?: Record<string, string>
}) {
  const sections = React.useMemo(
    () => buildNavSections(docs, navOrder, navLabels),
    [docs, navOrder, navLabels],
  )

  return (
    <div className={cn(className, '')}>
      {sections.map((section, index) => (
        <React.Fragment key={section.label ?? index}>
          {section.label && (
            <h2
              className={cn(
                // Same treatment as the "On This Page" heading of the ToC
                'px-(--rgrid-m) text-xs font-medium uppercase tracking-wider',
                'text-on-surface-variant/60',
                'mb-2',
                index > 0 && 'mt-6',
              )}
            >
              {section.label}
            </h2>
          )}
          <ul>
            {section.nodes.map((node) => (
              <li key={node.name}>
                {collapsible ? (
                  <NavCategoryCollapsible node={node} asPath={asPath} depth={0} />
                ) : (
                  <NavCategory node={node} asPath={asPath} depth={0} />
                )}
              </li>
            ))}
          </ul>
        </React.Fragment>
      ))}
    </div>
  )
}
