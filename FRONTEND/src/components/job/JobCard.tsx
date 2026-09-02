import React from 'react';
import { Link } from 'react-router-dom';
import { JobResponse } from '../../types/api';
import { Card } from '../ui/Card';
import { JobStatusBadge } from './JobStatusBadge';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';

interface JobCardProps {
  job: JobResponse;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  return (
    <Link to={`/job/${job.id}`} className="block group">
      <Card className="hover:border-brand-500/40 hover:bg-slate-800/30 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <JobStatusBadge status={job.status} />
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {job.num_thumbnails} thumbnail{job.num_thumbnails > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-white font-medium line-clamp-2">{job.prompt}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-surface-border flex items-center justify-center shrink-0 group-hover:border-brand-500/40 group-hover:bg-brand-500/10 transition-colors">
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors" />
          </div>
        </div>
      </Card>
    </Link>
  );
};
