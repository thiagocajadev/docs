import { t } from '@/i18n'
import cn from '@/lib/cn'
import { folderRedirect, getData, getDocs, getFolderSlugs } from '@/utils/docs'
import { redirect } from 'next/navigation'

export type Props = {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  // A folder route only redirects, so it has no metadata of its own.
  if (await folderRedirect(...slug)) return {}

  const { doc } = await getData(...slug)

  const title = `${doc.metadata.title} · ${process.env.NEXT_PUBLIC_LIBNAME}`
  const description = doc.metadata.description
  const url = doc.url
  const image = doc.image

  return {
    title,
    description,
    openGraph: {
      title,
      images: [{ url: image }],
      description,
      url,
      // Repeated from the root layout: a page-level `openGraph` replaces the parent's wholesale,
      // so leaving this out drops og:locale from every doc page.
      locale: t('meta.ogLocale'),
      type: 'article',
    },
  }
}

export default async function Page({ params }: Props) {
  // console.log('page', params)

  const { slug } = await params

  const target = await folderRedirect(...slug)
  if (target) redirect(target)

  const { doc } = await getData(...slug) // [ 'getting-started', 'introduction' ]

  return (
    <>
      <header className={cn('mb-6 mt-8 border-b', 'border-outline-variant/50')}>
        <h1 className="mb-2 text-5xl font-bold tracking-tighter">{doc.title}</h1>
        {doc.description && (
          <div className={cn('my-2 text-base leading-5', 'text-on-surface-variant/50')}>
            {doc.description}
          </div>
        )}
      </header>
      {doc ? <>{doc.content}</> : 'empty doc'}
    </>
  )
}

export async function generateStaticParams() {
  console.log('generateStaticParams')

  // return [
  //   { slug: ['getting-started', 'introduction'] },
  //   { slug: ['getting-started', 'installation'] },
  //   { slug: ['getting-started', 'your-first-scene'] },
  //   { slug: [ 'getting-started', 'examples' ] },
  //   { slug: [ 'api', 'canvas' ] },
  //   { slug: [ 'api', 'objects' ] },
  //   { slug: [ 'api', 'hooks' ] },
  //   { slug: [ 'api', 'events' ] },
  //   { slug: [ 'api', 'additional-exports' ] },
  //   { slug: [ 'advanced', 'scaling-performance' ] },
  //   { slug: [ 'advanced', 'pitfalls' ] },
  //   { slug: [ 'tutorials', 'v8-migration-guide' ] },
  //   { slug: [ 'tutorials', 'events-and-interaction' ] },
  //   { slug: [ 'tutorials', 'loading-models' ] },
  //   { slug: [ 'tutorials', 'loading-textures' ] },
  //   { slug: [ 'tutorials', 'basic-animations' ] },
  //   { slug: [ 'tutorials', 'using-with-react-spring' ] },
  //   { slug: [ 'tutorials', 'typescript' ] },
  //   { slug: [ 'tutorials', 'testing' ] },
  //   { slug: [ 'tutorials', 'how-it-works' ] }
  // ]

  const MDX = process.env.MDX
  if (!MDX) {
    console.warn('MDX env var not set')
    return []
  }

  const docs = await getDocs(MDX, null, true)

  // Folders that hold pages but are not pages themselves get a route too, so `/sql/conventions`
  // redirects instead of 404ing.
  const folders = await getFolderSlugs(MDX)

  return [...docs.map(({ slug }) => ({ slug })), ...folders.map((slug) => ({ slug }))]
}
