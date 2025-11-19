import { CheckCircle2, HelpCircle } from 'lucide-react';

interface Claim {
  id?: string;
  subject: string;
  predicate: string;
  object: string;
  rawText: string;
  confidence?: number;
}

interface ClaimListProps {
  title: string;
  source: string;
  claims: Claim[];
  color: 'blue' | 'purple';
}

export default function ClaimList({ title, source, claims, color }: ClaimListProps) {
  const bgClass = color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20';
  const borderClass = color === 'blue' ? 'border-blue-100 dark:border-blue-800' : 'border-purple-100 dark:border-purple-800';
  const textClass = color === 'blue' ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300';

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-6 h-full`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${textClass}`}>{title}</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50 dark:bg-black/20 border border-black/5">
          {source}
        </span>
      </div>

      <div className="space-y-3">
        {claims.map((claim, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 text-sm">
            <p className="text-gray-800 dark:text-gray-200 mb-2">{claim.rawText}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 rounded">S: {claim.subject}</span>
                <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 rounded">P: {claim.predicate}</span>
                <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 rounded">O: {claim.object}</span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>{Math.round((claim.confidence || 0) * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
