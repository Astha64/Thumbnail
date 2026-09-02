import React from 'react';
import { JobStatus } from '../../types/api';
import { Badge, BadgeTone } from '../ui/Badge';
import { Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
}

interface StatusConfig {
  tone: BadgeTone;
  label: string;
  icon: React.ReactNode;
}

const statusConfig: Record<JobStatus, StatusConfig> = {
  pending: { tone: 'warning', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
  processing: { tone: 'info', label: 'Processing', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed: { tone: 'success', label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { tone: 'danger', label: 'Failed', icon: <AlertTriangle className="w-3 h-3" /> },
};

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status }) => {
  const { tone, label, icon } = statusConfig[status] || statusConfig.pending;
  return (
    <Badge tone={tone}>
      {icon}
      {label}
    </Badge>
  );
};
