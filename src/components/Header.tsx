import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white/50 backdrop-blur-xl dark:border-neutral-800 dark:bg-zinc-900/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            TS
          </div>
          TruthScope
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
          <Link href="https://github.com" target="_blank" className="hover:text-blue-600 transition-colors">GitHub</Link>
        </nav>
      </div>
    </header>
  );
}
