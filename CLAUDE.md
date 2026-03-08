# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also `../CLAUDE.md` for shared monorepo context (tech stack, env vars, conventions).

## Commands

```sh
npm run dev          # dev server (port 8080)
npm run build        # production build
npm run lint         # eslint
```

No test runner is configured.

## Architecture

Photography portfolio for "Morgan Blake" with admin CMS. Supabase project: `ibmjjzrsyrrnlviwhhlv`.

### Data flow

Gallery data comes from two sources with automatic fallback:

1. **Primary**: Supabase tables `gallery_photos` + `gallery_categories` via `src/services/gallery.ts`
2. **Fallback**: Pexels API (`src/services/pexels.ts`) when DB has no photos for a category

The fallback is checked per-page in `Index.tsx` and `CategoryGallery.tsx` — if `fetchPhotosByCategory()` returns empty, it calls `fetchMixedMedia()` from Pexels (80% photos, 20% videos interleaved).

### Key services

- `src/services/gallery.ts` — Supabase queries, `GalleryPhoto`/`GalleryCategory` types, `getPublicUrl()` for storage URLs, `transformToGalleryItem()` for normalizing DB records to display format
- `src/services/pexels.ts` — Pexels API client with category-to-query mapping (`categoryQueries`), photo/video fetching, `transformPexelsToGalleryImage()` for normalizing to same display format

### Auth

- `src/hooks/useAuth.ts` — hook wrapping `supabase.auth` (session, user, signOut)
- `/login` uses Google OAuth via Supabase
- `/admin` redirects to `/login` if not authenticated (checked in component, no route guard)

### Gallery rendering

`MasonryGallery` uses inline-block layout (not CSS columns) with fixed 270px row height. Images are sized by intrinsic aspect ratio using invisible SVG placeholders. Hover effect: non-hovered images get grayscale filter, hovered image shows `ProgressiveBlur` overlay with metadata text. Timer-based (2800ms) hover reset.

`Lightbox` is a fullscreen overlay with keyboard navigation, supporting both images and video.

### Storage

Photos uploaded via Admin CMS go to Supabase `gallery` storage bucket at path `uploads/{timestamp}-{random}.{ext}`. Public URLs constructed via `getPublicUrl()` which uses `VITE_SUPABASE_URL/storage/v1/object/public/gallery/`.

### DB tables

- `gallery_photos` — file_path, thumbnail_path, alt_text, category_id (FK), photographer, client, location, details, sort_order, is_video, video_path, width, height
- `gallery_categories` — name, slug, description, sort_order
- `profiles`, `contact_submissions`

Migrations in `supabase/migrations/`.
