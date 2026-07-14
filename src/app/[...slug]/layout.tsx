import * as React from 'react'

import { Layout, LayoutAside, LayoutContent, LayoutHeader, LayoutNav } from '@/components/Layout'
import { Nav } from '@/components/Nav'
import { buildNavSections, flattenNavSections } from '@/components/Nav/buildNavTree'
import { ScrollToTopOnNavigate } from '@/components/ScrollToTopOnNavigate'
import Search from '@/components/Search'
import { Toc } from '@/components/mdx/Toc'
import { ToggleTheme } from '@/components/ToggleTheme'
import { t } from '@/i18n'
import cn from '@/lib/cn'
import { folderRedirect, getData } from '@/utils/docs'
import { parseNavLabels, parseNavOrder } from '@/utils/navOrder'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PiDiscordLogoLight } from 'react-icons/pi'
import { VscGithubAlt } from 'react-icons/vsc'
import { type DocEntry } from './DocsContext'
import { Menu } from './Menu'

// Inlined by next.config.mjs from package.json, so the footer names the DoDocs that built the site.
const version = process.env.DODOCS_VERSION

export type Props = {
  params: Promise<{ slug: string[] }>
  children: React.ReactNode
}

export default async function Layoutt({ params, children }: Props) {
  const { slug } = await params

  // A folder with no page of its own sends the reader to the first page inside it.
  const target = await folderRedirect(...slug)
  if (target) redirect(target)

  const { docs: fullDocs, doc } = await getData(...slug)

  // The nav is a client component, so it only gets what it reads. See DocEntry: passing
  // the docs as-is would serialize the whole corpus into every exported page.
  const docs: DocEntry[] = fullDocs.map(({ content, tableOfContents, ...entry }) => entry)

  const asPath = slug.join('/')

  const navOrder = parseNavOrder(process.env.NAV_ORDER)
  const navLabels = parseNavLabels(process.env.NAV_LABELS)

  const orderedDocs = flattenNavSections(buildNavSections(docs, navOrder))
  const currentPageIndex = orderedDocs.findIndex(({ url }) => url === `/${asPath}`)
  const currentPage = orderedDocs[currentPageIndex]
  const previousPage = currentPageIndex > 0 && orderedDocs[currentPageIndex - 1]
  const nextPage =
    currentPageIndex >= 0 &&
    currentPageIndex < orderedDocs.length - 1 &&
    orderedDocs[currentPageIndex + 1]

  const NEXT_PUBLIC_LIBNAME = process.env.NEXT_PUBLIC_LIBNAME
  const NEXT_PUBLIC_LIBNAME_SHORT = process.env.NEXT_PUBLIC_LIBNAME_SHORT
  const NEXT_PUBLIC_LIBNAME_DOTSUFFIX_LABEL = process.env.NEXT_PUBLIC_LIBNAME_DOTSUFFIX_LABEL
  const NEXT_PUBLIC_LIBNAME_DOTSUFFIX_HREF = process.env.NEXT_PUBLIC_LIBNAME_DOTSUFFIX_HREF

  const nav = <Nav docs={docs} asPath={asPath} navOrder={navOrder} navLabels={navLabels} />
  const header = (
    <div className="flex h-(--header-height) items-center gap-(--rgrid-m) px-(--rgrid-m)">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label={`${NEXT_PUBLIC_LIBNAME} Docs`}>
          <span className="font-bold">
            {NEXT_PUBLIC_LIBNAME_SHORT && (
              <span className="inline lg:hidden">{NEXT_PUBLIC_LIBNAME_SHORT}</span>
            )}
            <span className={cn(NEXT_PUBLIC_LIBNAME_SHORT ? 'hidden' : undefined, 'lg:inline')}>
              {NEXT_PUBLIC_LIBNAME}
            </span>
          </span>
        </Link>
        {NEXT_PUBLIC_LIBNAME_DOTSUFFIX_LABEL ? (
          <span className="font-normal flex items-center gap-2">
            <span aria-hidden>·</span>
            {NEXT_PUBLIC_LIBNAME_DOTSUFFIX_HREF ? (
              <a href={NEXT_PUBLIC_LIBNAME_DOTSUFFIX_HREF}>{NEXT_PUBLIC_LIBNAME_DOTSUFFIX_LABEL}</a>
            ) : (
              NEXT_PUBLIC_LIBNAME_DOTSUFFIX_LABEL
            )}
          </span>
        ) : null}
      </div>

      <Search className="grow" indexUrl={`${process.env.BASE_PATH ?? ''}/search-index.json`} />

      <div className="flex">
        {[
          { href: process.env.GITHUB, icon: <VscGithubAlt /> },
          { href: process.env.DISCORD, icon: <PiDiscordLogoLight /> },
        ].map(({ href, icon }, index) => (
          <React.Fragment key={index}>
            {href && (
              <Link
                href={href}
                className={cn('hidden size-9 items-center justify-center lg:flex')}
                target="_blank"
              >
                {icon}
              </Link>
            )}
          </React.Fragment>
        ))}
        <ToggleTheme className="hidden size-9 items-center justify-center lg:flex" />

        <Menu className="z-100 bg-surface absolute inset-0 top-(--header-height) h-[calc(100dvh-var(--header-height))] w-full overflow-auto lg:hidden">
          <div className="flex items-center gap-2 border-b border-outline-variant/50 px-(--rgrid-m) py-2">
            {process.env.GITHUB && (
              <Link
                href={process.env.GITHUB}
                className="flex size-9 items-center justify-center"
                target="_blank"
                aria-label="GitHub"
              >
                <VscGithubAlt />
              </Link>
            )}
            <ToggleTheme className="flex size-9 items-center justify-center" />
          </div>
          <div className="pb-8 pt-4">{nav}</div>
        </Menu>
      </div>
    </div>
  )
  const footer = (
    <>
      {(!!currentPage || doc.sourcecode) && (
        <div className="my-24">
          <div className="flex flex-col gap-4 text-right">
            {doc.sourcecode && (
              <p>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'mb-2 text-base hover:underline',
                    'font-mono text-on-surface-variant/50',
                  )}
                  href={doc.sourcecodeURL || '#no-sourcecode-url'}
                >
                  {doc.sourcecode}
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {(!!previousPage || !!nextPage) && (
        <nav className="my-16 lg:my-32">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            {!!previousPage && (
              <div className="">
                <label
                  className={cn(
                    'mb-2 text-xs font-bold uppercase leading-4',
                    'text-on-surface-variant/50',
                  )}
                >
                  {t('nav.previous')}
                </label>
                <div className="text-xl">
                  <Link href={previousPage.url} rel="prev">
                    {previousPage.title}
                  </Link>
                </div>
              </div>
            )}
            {!!nextPage && (
              <div className="ml-auto text-right">
                <label
                  className={cn(
                    'mb-2 text-xs font-bold uppercase leading-4',
                    'text-on-surface-variant/50',
                  )}
                >
                  {t('nav.next')}
                </label>
                <div className="text-xl">
                  <Link href={nextPage.url} rel="next">
                    {nextPage.title}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      <p
        className={cn(
          'my-12 text-center text-sm',
          'border-t border-outline-variant/30 pt-8 text-on-surface-variant/60',
        )}
      >
        <a
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://github.com/thiagocajadev/do-docs/releases/tag/v${version}`}
        >
          DoDocs v{version}
        </a>{' '}
        · {t('footer.developedBy')}{' '}
        <a
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/thiagocajadev"
        >
          @thiagocajadev
        </a>{' '}
        · {t('footer.basedOn')}{' '}
        <a
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/pmndrs/docs"
        >
          pmndrs/docs · Poimandres
        </a>
        .
      </p>
    </>
  )

  const toc = <Toc toc={doc.tableOfContents.filter(({ level }) => level > 0)} />

  return (
    <>
      <ScrollToTopOnNavigate />
      <Layout className="[--side-w:--spacing(72)]">
        <LayoutHeader className="z-10 border-b border-outline-variant/50 bg-surface/95 backdrop-blur-xl">
          {header}
        </LayoutHeader>
        <LayoutContent className="lg:mr-(--rgrid-m) xl:mr-0">
          <article className="post-container">
            {children}
            {footer}
          </article>
        </LayoutContent>
        <LayoutNav className="pt-8">{nav}</LayoutNav>
        <LayoutAside className="pt-8">{toc}</LayoutAside>
      </Layout>
    </>
  )
}
