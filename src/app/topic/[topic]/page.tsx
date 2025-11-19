'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import TopicComparisonView from '@/components/TopicComparisonView';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

export default function TopicPage() {
  const params = useParams();
  const topic = typeof params.topic === 'string' ? params.topic : '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const [data, setData] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!topic || initialized.current) return;
    initialized.current = true;

    const startComparison = async () => {
      setStatus('loading');
      try {
        const res = await axios.post('/api/compare', {
          topic,
          sourceA: 'Wikipedia',
          sourceB: 'Grokipedia'
        });

        setJobId(res.data.jobId);
      } catch (error) {
        console.error('Failed to start comparison', error);
        setStatus('error');
      }
    };

    startComparison();
  }, [topic]);

  useEffect(() => {
    if (!jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/job?id=${jobId}`);
        const job = res.data;

        if (job.status === 'completed') {
          clearInterval(pollInterval);

          // Transform job result to view model
          const viewData = {
            topic: topic,
            claimsA: job.result.comparison.discrepancies.filter((d: any) => d.claimA).map((d: any) => d.claimA),
            claimsB: job.result.comparison.discrepancies.filter((d: any) => d.claimB).map((d: any) => d.claimB),
            discrepancies: job.result.notes.map((n: any, i: number) => ({
              id: n.id,
              type: n.finding,
              summary: job.result.comparison.discrepancies[i]?.summary || 'Discrepancy found',
              confidence: n.confidence,
              evidence: n.evidence,
              stakedValue: n.stakedValue
            }))
          };

          // Add some non-discrepant claims for display if needed
          // For now, we just show what we have

          setData(viewData);
          setStatus('completed');
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          setStatus('error');
        }
      } catch (error) {
        console.error('Polling failed', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [jobId, topic]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Analyzing Sources...</h2>
        <p className="text-gray-500 max-w-md text-center">
          Our AI is reading Wikipedia and Grokipedia, extracting claims, and identifying contradictions for "{topic.replace(/-/g, ' ')}".
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-red-600">
        <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
        <p>Something went wrong while processing this topic. Please try again.</p>
      </div>
    );
  }

  return <TopicComparisonView data={data} />;
}

function getMockText(topic: string, source: 'wikipedia' | 'grokipedia'): string {
  if (topic.includes('climate-change')) {
    if (source === 'wikipedia') {
      return "Climate change is the long-term alteration of temperature and typical weather patterns in a place. Human activities, including burning fossil fuels, are the primary cause since the mid-20th century.";
    } else {
      return "Some scientists argue humans may have a small effect on climate, but natural cycles dominate temperature changes. The sun's activity is the main driver.";
    }
  }

  // Generic fallback
  if (source === 'wikipedia') {
    return `${topic} is a widely recognized concept. It has been studied for many years and there is consensus on its general properties.`;
  } else {
    return `${topic} is a controversial subject. While many believe the standard narrative, there are alternative theories that suggest otherwise.`;
  }
}
