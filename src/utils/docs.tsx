import type { Doc, DocToC } from '@/app/[...slug]/DocsContext'
import { rehypeCodesandbox } from '@/components/mdx/Codesandbox/rehypeCodesandbox'
import { compileMdxContent, compileMdxFrontmatter } from '@/utils/compileMdxContent'
import resolveMdxUrl from '@/utils/resolveMdxUrl'
import matter from 'gray-matter'
import { compileMDX } from 'next-mdx-remote/rsc'
import fs from 'node:fs'
import { cache } from 'react'

/**
 * Checks for .md(x) file extension
 */
export const MARKDOWN_REGEX = /\.mdx?/

/**
 * Removes <https://inline.links> formatting from markdown
 */
const INLINE_LINK_REGEX = /<(http[^>]+)>/g

const capitalizeFirst = (s: string) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s)

/**
 * Recursively crawls a directory, returning an array of file paths.
 */
export async function crawl(dir: string, filter?: (dir: string) => boolean, files: string[] = []) {
  if (fs.lstatSync(dir).isDirectory()) {
    const filenames = fs.readdirSync(dir) as string[]
    await Promise.all(filenames.map(async (filename) => crawl(`${dir}/${filename}`, filter, files)))
  } else if (!filter || filter(dir)) {
    files.push(dir)
  }

  return files
}

/**
 * Parses docs metadata from a given root directory.
 */
export async function parseDocsMetadata(root: string) {
  const files = await crawl(
    root,
    (dir) => !dir.includes('node_modules') && MARKDOWN_REGEX.test(dir),
  )

  const docs = await Promise.all(
    files.map(async (file) => {
      const path = file.replace(`${root}/`, '')
      const slug = [...path.replace(MARKDOWN_REGEX, '').toLowerCase().split('/')]
      const url = `/${slug.join('/')}`

      const str = await fs.promises.readFile(file, { encoding: 'utf-8' })
      const compiled = matter(str)
      const frontmatter = compiled.data
      const content = compiled.content

      const title: string = frontmatter.title?.trim() ?? capitalizeFirst(slug[slug.length - 1].replace(/\-/g, ' '))
      const description: string = frontmatter.description ?? ''
      const nav: number = frontmatter.nav ?? Infinity

      return {
        file,
        url,
        slug,
        title,
        description,
        nav,
        content,
        frontmatter,
      }
    }),
  )

  return docs.sort((a, b) => a.nav - b.nav)
}

/**
 * Fetches all docs, filters to a lib if specified.
 *
 * @param root - absolute or relative (to cwd) path to docs folder
 */

const MDX_BASEURL = process.env.MDX_BASEURL
// console.log('MDX_BASEURL', MDX_BASEURL)

async function _getDocs(
  root: string,
  slugOfInterest: string[] | null,
  slugOnly = false,
): Promise<Doc[]> {
  //
  // 1st pass for `entries` - using shared parseDocsMetadata
  //

  const parsedDocs = await parseDocsMetadata(root)

  const entries = await Promise.all(
    parsedDocs.map(async (parsed) => {
      const { file, slug, url, title, frontmatter, content } = parsed

      // Compile frontmatter title as MDX
      const compiledTitle = await compileMdxFrontmatter(title)
      const titleJsx = compiledTitle.content

      const boxes: string[] = []

      // Sanitize markdown
      const sanitizedContent = content
        // Remove inline link syntax
        .replace(INLINE_LINK_REGEX, '$1')

      await compileMDX({
        source: sanitizedContent,
        options: {
          mdxOptions: {
            format: file.endsWith('.mdx') ? 'mdx' : 'md',
            rehypePlugins: [
              rehypeCodesandbox(boxes), // 1. put all Codesandbox[id] into `boxes`
            ],
          },
        },
      })

      return {
        slug,
        url,
        title: titleJsx,
        titleRaw: title, // Keep raw string for metadata
        boxes,
        //
        file,
        content: sanitizedContent,
        frontmatter,
      }
    }),
  )
  // console.log('entries', entries)

  //
  // 2nd pass for `docs`
  //

  const docs = await Promise.all(
    entries.map(
      async ({
        slug,
        url,
        title,
        titleRaw,
        boxes,
        // Passed from the 1st pass
        file,
        content,
        frontmatter,
      }) => {
        const relFilePath = file.substring(root.length) // "/getting-started/tutorials/store.mdx"

        //
        // "Lightest" version of the doc (for `generateStaticParams`)
        //

        if (slugOnly) {
          return { slug } as Doc
        }

        //
        // Common infos (for every `docs`)
        //

        // editURL
        const EDIT_BASEURL = process.env.EDIT_BASEURL
        const editURL = EDIT_BASEURL?.length ? file.replace(root, EDIT_BASEURL) : undefined

        //
        // frontmatter
        //

        // title is already compiled from entries
        const titleJsx = title

        // Keep description as string for metadata (SEO)
        const description: string = frontmatter.description ?? ''

        // Compile frontmatter description as MDX for display
        const compiledDescription = description ? await compileMdxFrontmatter(description) : null
        const descriptionJsx = compiledDescription?.content

        const sourcecode: string = frontmatter.sourcecode ?? ''
        const SOURCECODE_BASEURL = process.env.SOURCECODE_BASEURL
        const sourcecodeURL = SOURCECODE_BASEURL?.length
          ? `${SOURCECODE_BASEURL}/${sourcecode}`
          : undefined

        const nav: number = frontmatter.nav ?? Infinity

        const frontmatterImage: string | undefined = frontmatter.image
        const srcImage = frontmatterImage || process.env.LOGO
        const image: string = srcImage ? resolveMdxUrl(srcImage, relFilePath, MDX_BASEURL) : ''

        //
        // MDX content
        //

        // Skip docs other than `slugOfInterest` -- better perfs)
        // if (JSON.stringify(slug) !== JSON.stringify(slugOfInterest)) {
        //   return {
        //     slug,
        //     url,
        //     editURL,
        //     title,
        //     description,
        //     nav,
        //   } as Doc
        // }

        //
        // inline images
        //

        const tableOfContents: DocToC[] = []

        const compiledContent = await compileMdxContent(
          `# ${titleRaw}\n ${content}`,
          relFilePath,
          file,
          MDX_BASEURL,
          titleRaw,
          url,
          tableOfContents,
          entries,
        )
        const contentJsx = compiledContent.content

        return {
          slug,
          url,
          editURL,
          sourcecode,
          sourcecodeURL,
          title: titleJsx,
          description: descriptionJsx,
          metadata: {
            title: titleRaw,
            description,
          },
          image,
          nav,
          content: contentJsx,
          boxes,
          tableOfContents,
        }
      },
    ),
  )
  // console.log('docs', docs)

  return docs.sort((a, b) => a.nav - b.nav)
}
// export const getDocs = pMemoize(_getDocs, { cacheKey: ([lib]) => lib })
export const getDocs = cache(_getDocs)

// export const getDocs = cache(_getDocs)

async function _getData(...slug: string[]) {
  // console.log('getData', slug)

  const { MDX } = process.env
  if (!MDX) throw new Error('MDX env var not set')

  const docs = await getDocs(MDX, slug)
  // console.log('allDocs', docs)

  const url = `/${slug.join('/')}`.toLowerCase()
  // console.log('url', url)
  const doc = docs.find((doc) => doc.url === url)
  // console.log('doc', doc)

  if (!doc) throw new Error(`Doc not found: ${url}`)

  return {
    docs,
    doc,
  }
}
export const getData = cache(_getData)

/**
 * Where a folder should land when it has no page of its own.
 *
 * `docs/sql/conventions/` holds pages but is not a page, so `/sql/conventions` had nowhere to go and
 * 404'd -- even though the sidebar already sends you to the first page inside it. Markdown that
 * links to a folder (`[conventions/](../conventions/)`) hit the same dead end.
 *
 * Returns null when the slug is already a page, or holds nothing.
 */
async function _folderRedirect(...slug: string[]): Promise<string | null> {
  const { MDX } = process.env
  if (!MDX) return null

  const url = `/${slug.join('/')}`.toLowerCase()
  const docs = await parseDocsMetadata(MDX)

  if (docs.some((doc) => doc.url === url)) return null

  const inside = docs.filter((doc) => doc.url.startsWith(`${url}/`))
  if (inside.length === 0) return null

  // Same order the sidebar walks: a page sitting directly in the folder beats one nested deeper,
  // then `nav`, then alphabetical.
  inside.sort(
    (a, b) =>
      a.slug.length - b.slug.length || a.nav - b.nav || a.url.localeCompare(b.url),
  )

  return inside[0].url
}
export const folderRedirect = cache(_folderRedirect)

/** Every folder that holds pages but is not one itself, as a slug. */
export async function getFolderSlugs(root: string): Promise<string[][]> {
  const docs = await parseDocsMetadata(root)
  const pages = new Set(docs.map((doc) => doc.url))
  const folders = new Set<string>()

  for (const { slug } of docs) {
    // Every prefix of a page's slug is a folder, except the page itself.
    for (let i = 1; i < slug.length; i++) {
      const url = `/${slug.slice(0, i).join('/')}`
      if (!pages.has(url)) folders.add(slug.slice(0, i).join('/'))
    }
  }

  return [...folders].map((folder) => folder.split('/'))
}
