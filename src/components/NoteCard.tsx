import { AlertTriangle, Check, HelpCircle, Info, Shield } from 'lucide-react';
import { useState } from 'react';

interface NoteCardProps {
  type: 'missing' | 'contradiction' | 'bias' | 'unsupported' | 'citation_absent';
  summary: string;
  confidence: number;
  evidence: string[];
  stakedValue: string;
  onStake: () => void;
}

export default function NoteCard({ type, summary, confidence, evidence, stakedValue, onStake }: NoteCardProps) {
  const [isStaking, setIsStaking] = useState(false);

  const handleStake = async () => {
    setIsStaking(true);
    await onStake();
    setIsStaking(false);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'contradiction': return { color: 'red', icon: AlertTriangle, label: 'Contradiction' };
      case 'missing': return { color: 'amber', icon: HelpCircle, label: 'Missing Info' };
      case 'bias': return { color: 'purple', icon: Info, label: 'Potential Bias' };
      default: return { color: 'gray', icon: HelpCircle, label: 'Note' };
    }
  };

  const style = getTypeStyles();
  const Icon = style.icon;

  // Tailwind dynamic classes workaround (simplified)
  const colorClasses = {
    red: 'bg-red-50 border-red-100 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    amber: 'bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
    purple: 'bg-purple-50 border-purple-100 text-purple-900 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200',
    gray: 'bg-gray-50 border-gray-100 text-gray-900 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200',
  }[style.color];

  return (
    <div className={`rounded-xl border p-4 ${colorClasses}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm uppercase tracking-wider opacity-80">{style.label}</span>
            <span className="text-xs font-mono opacity-60">Conf: {Math.round(confidence * 100)}%</span>
          </div>
          <p className="text-sm mb-3">{summary}</p>

          <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Shield className="w-3 h-3" />
              <span>Staked: {stakedValue} TRAC</span>
            </div>
            <button
              onClick={handleStake}
              disabled={isStaking}
              className="text-xs font-medium bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              {isStaking ? 'Staking...' : 'Stake on this'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
