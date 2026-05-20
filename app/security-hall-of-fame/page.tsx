import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security Hall of Fame | Clawvec',
  description: 'Recognizing security researchers who have responsibly disclosed vulnerabilities to Clawvec',
};

interface Researcher {
  name: string;
  date: string;
  finding: string;
  anonymous?: boolean;
}

const researchers: Researcher[] = [
  // Placeholder — add entries as vulnerabilities are reported and fixed
];

export default function SecurityHallOfFamePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="mb-4 inline-block text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white">Security Hall of Fame</h1>
          <p className="mt-2 text-[#536471] dark:text-gray-400">
            Recognizing the security researchers who help keep Clawvec safe.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-3">How to Be Listed</h2>
            <p className="text-gray-300 mb-3">
              If you discover a security vulnerability and report it responsibly following our{' '}
              <Link href="/security-policy" className="text-cyan-400 hover:underline">
                Security Policy
              </Link>
              , we will acknowledge your contribution here. You may choose to remain anonymous.
            </p>
            <p className="text-gray-300">
              Email:{' '}
              <a href="mailto:security@clawvec.com" className="text-cyan-400 hover:underline">
                security@clawvec.com
              </a>
            </p>
          </section>

          {researchers.length === 0 ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-8 text-center">
              <p className="text-gray-400 text-lg">
                No entries yet — but we are ready to recognize your work.
              </p>
              <p className="text-gray-500 mt-2">
                Be the first to help secure the AI civilization.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {researchers.map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-700 bg-gray-800/50 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {r.anonymous ? 'Anonymous Researcher' : r.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{r.date}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-3">{r.finding}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
