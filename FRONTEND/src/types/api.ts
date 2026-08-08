// Auth & User Types
export interface UserResponse {
  id: string;
  email: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserSignup {
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Status Enums & Literal Union Types
export type ThumbnailStatus = 'pending' | 'generating' | 'uploaded' | 'failed';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type StyleName = 'bold_dramatic' | 'clean_minimal' | 'vibrant_energetic';

// ImageKit Transformation Variants
export interface ThumbnailVariants {
  youtube: string; // ?tr=w-1280,h-720,fo-auto,c-maintain_ratio
  shorts: string;  // ?tr=w-1080,h-1920,fo-auto,c-maintain_ratio
  square: string;  // ?tr=w-1080,h-1080,fo-auto,c-maintain_ratio
}

// Thumbnail Response Model (matches backend Thumbnail object)
export interface ThumbnailResponse {
  id: string;
  style_name: StyleName;
  status: ThumbnailStatus;
  imagekit_url: string | null;
  error_message: string | null;
  variants: ThumbnailVariants | null;
}

// Job Response Model (matches backend Job object)
export interface JobResponse {
  id: string;
  prompt: string;
  num_thumbnails: number;
  headshot_url: string;
  status: JobStatus;
  thumbnails: ThumbnailResponse[];
}

// API Request Models
export interface CreateJobRequest {
  prompt: string;
  num_thumbnails: number;
  headshot_url: string;
}

export interface CreateJobResponse {
  job_id: string;
}

export interface UploadResponse {
  url: string;
}

// Real-Time SSE Stream Event Payloads
export interface ThumbnailReadyEvent {
  thumbnail_id: string;
  style_name: StyleName;
  imagekit_url: string;
  variants: ThumbnailVariants;
}

export interface ThumbnailFailedEvent {
  thumbnail_id: string;
  style_name: StyleName;
  error: string;
}

export interface JobCompletedEvent {
  job_id: string;
  status: JobStatus;
}
