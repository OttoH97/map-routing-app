import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 font-sans dark:from-black dark:to-zinc-900">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Map Routing App
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          A Next.js application for interactive OpenStreetMap-based routing.
        </p>

        {/* Navigation Cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {/* OSM Map Test Card */}
          <Link
            href="/osm-test"
            className="group flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:shadow-blue-400/10"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              OSM Map Test
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              View and interact with an OpenStreetMap rendered client-side using Leaflet.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:gap-2 transition-all">
              Go to OSM Map →
            </span>
          </Link>

          {/* Documentation Card */}
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col items-start rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:shadow-blue-400/10"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Documentation
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Explore Next.js docs, guides, and API references.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:gap-2 transition-all">
              Read Docs →
            </span>
          </a>
    </div>
      </div>
    </div>
  );
}


