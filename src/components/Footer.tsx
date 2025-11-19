export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-zinc-900/50 py-8">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} TruthScope. Powered by OriginTrail & OpenAI.</p>
      </div>
    </footer>
  );
}
