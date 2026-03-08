import { supabase } from "@/integrations/supabase/client";

export interface GalleryPhoto {
  id: string;
  title: string | null;
  alt_text: string;
  file_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  category_id: string | null;
  photographer: string | null;
  client: string | null;
  location: string | null;
  details: string | null;
  sort_order: number;
  is_video: boolean;
  video_path: string | null;
  created_at: string;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/gallery`;

export function getPublicUrl(path: string): string {
  return `${STORAGE_URL}/${path}`;
}

export async function fetchCategories(): Promise<GalleryCategory[]> {
  const { data, error } = await supabase
    .from("gallery_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPhotosByCategory(categorySlug: string): Promise<GalleryPhoto[]> {
  // First get category id from slug
  const { data: cat } = await supabase
    .from("gallery_categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!cat) return [];

  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("category_id", cat.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function transformToGalleryItem(photo: GalleryPhoto) {
  return {
    type: photo.is_video ? ("video" as const) : ("image" as const),
    src: getPublicUrl(photo.thumbnail_path || photo.file_path),
    highResSrc: getPublicUrl(photo.file_path),
    videoSrc: photo.video_path ? getPublicUrl(photo.video_path) : undefined,
    alt: photo.alt_text || photo.title || "Gallery photo",
    photographer: photo.photographer || undefined,
    client: photo.client || undefined,
    location: photo.location || undefined,
    details: photo.details || undefined,
    width: photo.width || undefined,
    height: photo.height || undefined,
  };
}
