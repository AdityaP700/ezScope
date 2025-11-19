'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function TopicSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Encode the topic to be URL safe
      const slug = encodeURIComponent(query.trim().toLowerCase().replace(/\s+/g, '-'));
      router.push(`/topic/${slug}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto relative">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-xl p-2 shadow-xl">
          <Search className="w-6 h-6 text-gray-400 ml-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a topic to compare (e.g., Climate Change, Artificial Intelligence)..."
            className="w-full bg-transparent border-none focus:ring-0 text-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Compare
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-3 text-sm text-gray-500">
        <span>Trending:</span>
        <button type="button" onClick={() => router.push('/topic/climate-change')} className="hover:text-blue-600 hover:underline">Climate Change</button>
        <button type="button" onClick={() => router.push('/topic/nuclear-energy')} className="hover:text-blue-600 hover:underline">Nuclear Energy</button>
        <button type="button" onClick={() => router.push('/topic/gmo')} className="hover:text-blue-600 hover:underline">GMOs</button>
      </div>
    </form>
  );
}
