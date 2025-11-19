'use client';

import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import axios from 'axios';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reportUrl: string) => void;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    setStep('processing');
    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await axios.post('/api/payment', { amount: 10 });
      if (res.data.clientSecret) {
        setStep('success');
        // Simulate report generation delay
        setTimeout(() => {
          onSuccess('/reports/sample-report.json');
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Payment failed', error);
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-zinc-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Premium Analysis Report</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'select' && (
            <>
              <div className="mb-6 space-y-4">
                <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 relative">
                  <div className="absolute top-3 right-3 text-blue-600">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-lg mb-1">Deep Dive Report</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Get a comprehensive PDF report with detailed citation analysis, historical context, and bias evaluation.
                  </p>
                  <div className="text-2xl font-bold text-blue-600">10 TRAC</div>
                </div>
              </div>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Purchase Report
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h4 className="text-lg font-semibold mb-2">Processing Payment...</h4>
              <p className="text-sm text-gray-500">Please wait while we confirm your transaction.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Payment Successful!</h4>
              <p className="text-sm text-gray-500">Generating your report now...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
