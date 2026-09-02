import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateJob } from '../../hooks/useCreateJob';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const createJobSchema = z.object({
  prompt: z
    .string()
    .min(5, 'Prompt must be at least 5 characters')
    .max(500, 'Prompt must be at most 500 characters'),
  num_thumbnails: z.number().int().min(1).max(3),
});

type CreateJobValues = z.infer<typeof createJobSchema>;

interface CreateJobFormProps {
  headshotUrl: string;
}

const thumbnailOptions = [1, 2, 3] as const;

export const CreateJobForm: React.FC<CreateJobFormProps> = ({ headshotUrl }) => {
  const { mutateAsync: createJob, isPending, error } = useCreateJob();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateJobValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      prompt: '',
      num_thumbnails: 1,
    },
  });

  const promptValue = watch('prompt');
  const numThumbnails = watch('num_thumbnails');

  const onSubmit = async (values: CreateJobValues) => {
    setSubmitError(null);
    try {
      await createJob({
        prompt: values.prompt,
        num_thumbnails: values.num_thumbnails,
        headshot_url: headshotUrl,
      });
      // Navigation happens in useCreateJob's onSuccess
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        setSubmitError(detail);
      } else {
        setSubmitError('Failed to create job. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {submitError && (
        <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          Thumbnail Prompt
        </label>
        <textarea
          placeholder="Describe the mood and style for your YouTube thumbnail..."
          rows={4}
          {...register('prompt')}
          className={cn(
            'w-full bg-slate-900/70 border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 resize-none',
            errors.prompt
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-surface-border focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 hover:border-slate-600'
          )}
        />
        <div className="flex items-center justify-between text-xs">
          {errors.prompt ? (
            <span className="text-rose-400">{errors.prompt.message}</span>
          ) : (
            <span className="text-slate-500">5–500 characters</span>
          )}
          <span className={cn('text-slate-500', promptValue.length > 450 && 'text-amber-400')}>
            {promptValue.length}/500
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          Number of Thumbnails
        </label>
        <div className="grid grid-cols-3 gap-3">
          {thumbnailOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue('num_thumbnails', n, { shouldValidate: true })}
              className={cn(
                'py-3 rounded-xl border text-sm font-semibold transition-all duration-200',
                numThumbnails === n
                  ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                  : 'border-surface-border bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              )}
            >
              {n} {n === 1 ? 'Thumbnail' : 'Thumbnails'}
            </button>
          ))}
        </div>
        {errors.num_thumbnails && (
          <p className="text-xs text-rose-400">{errors.num_thumbnails.message}</p>
        )}
      </div>

      <div className="rounded-xl border border-surface-border bg-slate-900/40 p-3 flex items-center gap-3">
        <img
          src={headshotUrl}
          alt="Uploaded headshot"
          className="w-14 h-14 rounded-lg object-cover border border-surface-border bg-slate-800"
        />
        <div>
          <p className="text-xs text-slate-400">Using headshot</p>
          <p className="text-sm text-white font-medium truncate max-w-[260px]">Ready to use</p>
        </div>
        <ImageIcon className="w-5 h-5 text-brand-400 ml-auto shrink-0" />
      </div>

      <Button type="submit" isLoading={isPending} disabled={isPending} className="w-full" size="lg">
        {isPending ? 'Creating Job...' : 'Generate Thumbnails'}
      </Button>
    </form>
  );
};
