import { useState, useRef, useCallback } from 'react';
import { useUploadHeadshot } from '../../hooks/useUploadHeadshot';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { UploadCloud, ImageIcon, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeadshotUploaderProps {
  onUploaded: (url: string) => void;
}

export const HeadshotUploader: React.FC<HeadshotUploaderProps> = ({ onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadHeadshot();

  const handleFileSelected = useCallback((selected: File | null) => {
    if (!selected) return;
    const isImage = selected.type.startsWith('image/');
    if (!isImage) {
      setUploadError('Please upload a valid image file (JPG, PNG, etc.)');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setUploadError('Image must be smaller than 10MB');
      return;
    }
    setUploadError(null);
    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0] ?? null;
      handleFileSelected(dropped);
    },
    [handleFileSelected]
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploadError(null);
    try {
      const response = await uploadMutation.mutateAsync(file);
      onUploaded(response.url);
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || 'Upload failed. Please try again.');
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 md:p-14 text-center cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
              : 'border-slate-700 bg-slate-900/40 hover:border-brand-500/60 hover:bg-slate-800/40'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
          />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-pink-500/20 border border-brand-500/30 flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-brand-400" />
          </div>
          <p className="text-base font-semibold text-white">
            Drag & drop your headshot here
          </p>
          <p className="text-sm text-slate-400 mt-1">
            or <span className="text-brand-400 font-medium">browse files</span>
          </p>
          <p className="text-xs text-slate-500 mt-3">
            JPG, PNG or WebP · Max 10MB
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-slate-900/40 overflow-hidden">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Headshot preview"
              className="w-full max-h-72 object-contain bg-slate-950/60"
            />
            <button
              type="button"
              onClick={reset}
              className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/80 border border-surface-border text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Remove image"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                {file?.type.includes('image') ? (
                  <ImageIcon className="w-5 h-5 text-brand-400" />
                ) : (
                  <UploadCloud className="w-5 h-5 text-brand-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{file?.name}</p>
                <p className="text-xs text-slate-400">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Headshot'}
            </Button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-3 text-sm text-slate-300 justify-center">
          <Spinner size="sm" />
          <span>Uploading your headshot...</span>
        </div>
      )}

      {uploadMutation.isSuccess && (
        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Headshot uploaded successfully!</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl px-4 py-3 text-sm">
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};