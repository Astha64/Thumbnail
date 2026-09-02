import { useState } from 'react';
import { HeadshotUploader } from '../components/headshot/HeadshotUploader';
import { CreateJobForm } from '../components/job/CreateJobForm';
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

type Step = 1 | 2;

export default function CreatePage() {
  const [step, setStep] = useState<Step>(1);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);

  const handleUploaded = (url: string) => {
    setHeadshotUrl(url);
    // Auto-advance to step 2
    setTimeout(() => setStep(2), 400);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Generate Thumbnails
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload your headshot and configure the generation settings
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        {[
          { num: 1, label: 'Upload Headshot', icon: <ImageIcon className="w-4 h-4" /> },
          { num: 2, label: 'Configure & Generate', icon: <Settings className="w-4 h-4" /> },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            {i > 0 && <div className="w-8 h-px bg-surface-border" />}
            <button
              type="button"
              onClick={() => s.num === 1 && headshotUrl && setStep(1)}
              disabled={s.num === 2 && !headshotUrl}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200',
                step === s.num
                  ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                  : s.num < step || (s.num === 1 && headshotUrl)
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-surface-border bg-slate-900/40 text-slate-500'
              )}
            >
              {s.num < step || (s.num === 1 && headshotUrl) ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                s.icon
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">Step {s.num}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-panel rounded-2xl border border-surface-border p-6 md:p-8">
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Upload your headshot</h2>
            <p className="text-sm text-slate-400">
              Use a clear face photo for the best results. Front-facing, well-lit photos work best.
            </p>
            <HeadshotUploader onUploaded={handleUploaded} />
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change headshot
            </button>
            <h2 className="text-lg font-semibold text-white">Configure your thumbnail</h2>
            <p className="text-sm text-slate-400">
              Describe the mood and style you want, then select how many thumbnails to generate.
            </p>
            {headshotUrl && <CreateJobForm headshotUrl={headshotUrl} />}
          </div>
        )}
      </div>
    </div>
  );
}
