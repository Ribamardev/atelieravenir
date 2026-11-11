export type Client = {
  id: string;
  name: string;
  segment: string | null;
  palette: string[];
  brand_notes: string | null;
  rules: string | null;
  fonts: string | null;
  created_at: string;
};

export type BrandAsset = {
  id: string;
  client_id: string;
  kind: "logo" | "manual" | "font" | "other";
  name: string | null;
  storage_path: string;
  mime: string | null;
  is_primary: boolean;
  created_at: string;
  url?: string;
};

export type Reference = {
  id: string;
  client_id: string;
  storage_path: string;
  notes: string | null;
  created_at: string;
  url?: string;
};

export type Model = {
  id: string;
  label: string;
  path: string;
  image_field: string | null;
  image_field_is_list: boolean;
  max_refs: number;
  aspect_ratios: string[];
  num_images_field: string | null;
  extra: Record<string, unknown>;
  active: boolean;
  is_default: boolean;
};

export type Format = "feed" | "story";

export type PlannedPiece = {
  format: Format;
  title: string;
  summary_pt: string;
  prompt: string;
  reference_ids: string[];
};

export type Job = {
  id: string;
  client_id: string;
  model_id: string;
  format: Format;
  title: string | null;
  summary_pt: string | null;
  prompt: string;
  reference_ids: string[];
  aspect_ratio: string | null;
  hf_request_id: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

export type GenImage = {
  id: string;
  job_id: string;
  client_id: string;
  storage_path: string;
  review: "pending" | "approved" | "rejected";
  feedback: string | null;
  created_at: string;
  url?: string;
};

export const BUCKET = "sm-media";
export const TERMINAL = ["completed", "failed", "nsfw", "canceled"];
