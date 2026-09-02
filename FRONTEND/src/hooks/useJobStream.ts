import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '../lib/token';
import {
  ThumbnailReadyEvent,
  ThumbnailFailedEvent,
  JobCompletedEvent,
  JobStatus,
  StyleName,
  ThumbnailVariants,
} from '../types/api';

export interface StreamedThumbnail {
  id: string;
  style_name: StyleName;
  imagekit_url: string;
  variants: ThumbnailVariants;
  status: 'uploaded' | 'failed';
  error_message: string | null;
}

interface UseJobStreamResult {
  streamedThumbnails: StreamedThumbnail[];
  jobStatus: JobStatus | null;
  isComplete: boolean;
  streamError: string | null;
}

interface SSEEvent {
  event?: string;
  data?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useJobStream(jobId: string | undefined, enabled: boolean): UseJobStreamResult {
  const [streamedThumbnails, setStreamedThumbnails] = useState<StreamedThumbnail[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const handleEvent = useCallback(
    (event: string, data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (event === 'thumbnail_ready') {
          const payload = parsed as ThumbnailReadyEvent;
          setStreamedThumbnails((prev) => {
            const existing = prev.find((t) => t.id === payload.thumbnail_id);
            if (existing) {
              return prev.map((t) =>
                t.id === payload.thumbnail_id
                  ? {
                      ...t,
                      imagekit_url: payload.imagekit_url,
                      variants: payload.variants,
                      status: 'uploaded',
                      error_message: null,
                    }
                  : t
              );
            }
            return [
              ...prev,
              {
                id: payload.thumbnail_id,
                style_name: payload.style_name,
                imagekit_url: payload.imagekit_url,
                variants: payload.variants,
                status: 'uploaded',
                error_message: null,
              },
            ];
          });
        } else if (event === 'thumbnail_failed') {
          const payload = parsed as ThumbnailFailedEvent;
          setStreamedThumbnails((prev) => {
            const existing = prev.find((t) => t.id === payload.thumbnail_id);
            if (existing) {
              return prev.map((t) =>
                t.id === payload.thumbnail_id
                  ? {
                      ...t,
                      status: 'failed',
                      error_message: payload.error,
                    }
                  : t
              );
            }
            return [
              ...prev,
              {
                id: payload.thumbnail_id,
                style_name: payload.style_name,
                imagekit_url: '',
                variants: {} as ThumbnailVariants,
                status: 'failed',
                error_message: payload.error,
              },
            ];
          });
        } else if (event === 'job_completed') {
          const payload = parsed as JobCompletedEvent;
          setJobStatus(payload.status);
          setIsComplete(true);
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          queryClient.invalidateQueries({ queryKey: ['job', jobId] });
        }
      } catch (err) {
        console.error('[SSE] failed to parse event data', err);
      }
    },
    [jobId, queryClient]
  );

  useEffect(() => {
    if (!jobId || !enabled || isComplete) return;

    const token = tokenStorage.get();
    if (!token) {
      setStreamError('Not authenticated');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let disposed = false;

    const connect = async () => {
      try {
        await fetchEventSource(`${API_BASE_URL}/api/job/${jobId}/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          openWhenHidden: true,
          onopen: async () => {},
          onmessage: (ev: SSEEvent) => {
            if (disposed) return;
            if (ev.event && ev.data) {
              handleEvent(ev.event, ev.data);
            }
          },
          onclose: () => {},
          onerror: (err: any) => {
            if (disposed) return;
            // If aborted intentionally, don't show error
            if (controller.signal.aborted) return;
            setStreamError('Stream connection interrupted. Refresh to reconnect.');
          },
        });
      } catch (err: any) {
        if (disposed) return;
        if (controller.signal.aborted) return;
        console.error('[SSE] error', err);
        setStreamError('Could not connect to live stream.');
      }
    };

    connect();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [jobId, enabled, isComplete, handleEvent]);

  // Reset state when jobId changes
  useEffect(() => {
    setStreamedThumbnails([]);
    setJobStatus(null);
    setIsComplete(false);
    setStreamError(null);
  }, [jobId]);

  return { streamedThumbnails, jobStatus, isComplete, streamError };
}
