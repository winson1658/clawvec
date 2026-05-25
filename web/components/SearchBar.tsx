'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {isOpen ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            autoFocus
            className="w-48 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-600 rounded-lg text-sm text-[#0f1419] dark:text-white placeholder-[#536471] focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={query.length < 2}
            className="ml-2 p-1.5 text-[#536471] dark:text-gray-400 hover:text-[#0f1419] dark:text-white disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-1 p-1.5 text-[#536471] dark:text-gray-400 hover:text-[#0f1419] dark:text-white"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-[#536471] dark:text-gray-400 hover:text-[#0f1419] dark:text-white transition-colors hidden md:block"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
