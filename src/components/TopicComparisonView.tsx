'use client';

import { useState } from 'react';
import ClaimList from './ClaimList';
import NoteCard from './NoteCard';
import PaymentModal from './PaymentModal';
import { FileText, Share2 } from 'lucide-react';

interface ComparisonData {
  topic: string;
  claimsA: any[];
  claimsB: any[];
  discrepancies: any[];
}

export default function TopicComparisonView({ data }: { data: ComparisonData }) {
  const [showPayment, setShowPayment] = useState(false);

  const handleStake = async (noteId: string) => {
    // Call API to stake
    console.log('Staking on note', noteId);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 capitalize">{data.topic.replace(/-/g, ' ')}</h1>
          <p className="text-gray-500 dark:text-gray-400">Analysis based on Wikipedia vs Grokipedia</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm font-medium">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={() => setShowPayment(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Get Premium Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Source A */}
        <div className="lg:col-span-1">
          <ClaimList
            title="Wikipedia"
            source="Source A"
            claims={data.claimsA}
            color="blue"
          />
        </div>

        {/* Middle Column: Community Notes / Diffs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-center mb-4">
            <span className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
              {data.discrepancies.length} Discrepancies Found
            </span>
          </div>

          {data.discrepancies.map((diff, idx) => (
            <NoteCard
              key={idx}
              type={diff.type}
              summary={diff.summary}
              confidence={diff.confidence}
              evidence={diff.evidence || []}
              stakedValue={diff.stakedValue || '0'}
              onStake={() => handleStake(diff.id)}
            />
          ))}

          {data.discrepancies.length === 0 && (
            <div className="text-center p-8 border border-dashed border-gray-300 rounded-xl text-gray-500">
              No significant discrepancies found between sources.
            </div>
          )}
        </div>

        {/* Right Column: Source B */}
        <div className="lg:col-span-1">
          <ClaimList
            title="Grokipedia"
            source="Source B"
            claims={data.claimsB}
            color="purple"
          />
        </div>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={(url) => window.open(url, '_blank')}
      />
    </div>
  );
}
