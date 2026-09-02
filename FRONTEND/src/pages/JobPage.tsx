import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs.api';
import { useJobStream } from '../hooks/useJobStream';
import { ThumbnailGrid } from '../components/thumbnail/ThumbnailGrid';
import { JobStatusBadge } from '../components/job/JobStatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { ThumbnailResponse } from '../types/api';

export default function JobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.getJob(jobId!),
    enabled: !!jobId,
    retry: 2,
  });

  const job = jobQuery.data;

  const isJobPending = job?.status === 'pending' || job?.status === 'processing';

  const { streamedThumbnails, isComplete, streamError } = useJobStream(jobId, !!jobId && isJobPending);

  const displayThumbnails: ThumbnailResponse[] = useMemo(() => {
    if (!job) return [];

    // Merge streamed updates into job thumbnails
    const base = [...job.thumbnails];
    for (const st of streamedThumbnails) {
      const idx = base.findIndex((t) => t.id === st.id);
      if (idx !== -1) {
        base[idx] = {
          ...base[idx],
          status: st.status === 'uploaded' ? 'uploaded' : 'failed',
          imagekit_url: st.imagekit_url || base[idx].imagekit_url,
          variants: st.variants || base[idx].variants,
          error_message: st.error_message,
        };
      } else {
        // Brand new thumbnail not in initial snapshot
        base.push({
          id: st.id,
          style_name: st.style_name,
          status: st.status === 'uploaded' ? 'uploaded' : 'failed',
          imagekit_url: st.imagekit_url,
          variants: st.variants,
          error_message: st.error_message,
        });
      }
    }
    return base;
  }, [job, streamedThumbnails]);

  const pendingCount = useMemo(() => {
    if (!job) return job ? 0 : 0;
    const totalExpected = job.num_thumbnails;
    const doneCount = displayThumbnails.filter(
      (t) => t.status === 'uploaded' || t.status === 'failed'
    ).length;
    return Math.max(0, totalExpected - doneCount);
  }, [job, displayThumbnails]);

  if (jobQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm">Loading job details...</p>
      </div>
    );
  }

  if (jobQuery.isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-rose-400 text-sm">Failed to load job. It may not exist or you may not have access.</p>
        <Link
          to="/dashboard"
          className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const allComplete = job.status === 'completed' || job.status === 'failed' || isComplete;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
              Job {job.id.slice(0, 8)}
            </span>
            <JobStatusBadge status={allComplete ? job.status : 'processing'} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white mt-1">{job.prompt}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!allComplete && (
            <div className="flex items-center gap-2 text-xs text-brand-300 bg-brand-500/10 border border-brand-500/25 px-3 py-2 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              Generating...
            </div>
          )}
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['job', jobId] })}
            className="p-2 rounded-xl border border-surface-border text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh job"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Headshot reference */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-slate-900/40">
        <img
          src={job.headshot_url}
          alt="Reference headshot"
          className="w-12 h-12 rounded-lg object-cover border border-surface-border bg-slate-800"
        />
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Reference headshot</p>
          <p className="text-sm text-white truncate">{job.num_thumbnails} thumbnail{job.num_thumbnails > 1 ? 's' : ''} requested</p>
        </div>
      </div>

      {/* SSE Error */}
      {streamError && (
        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-xl px-4 py-3 text-sm">
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>{streamError}</span>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium underline ml-auto shrink-0"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Thumbnail Grid */}
      <ThumbnailGrid thumbnails={displayThumbnails} pendingCount={pendingCount} />
    </div>
  );
}
