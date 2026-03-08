import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { fetchCategories, fetchAllPhotos, getPublicUrl } from "@/services/gallery";
import type { GalleryCategory, GalleryPhoto } from "@/services/gallery";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Upload, LogOut, Plus, GripVertical } from "lucide-react";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"photos" | "categories">("photos");

  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("");
  const [uploadPhotographer, setUploadPhotographer] = useState("");
  const [uploadClient, setUploadClient] = useState("");
  const [uploadLocation, setUploadLocation] = useState("");

  // Category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatDescription, setNewCatDescription] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [cats, pics] = await Promise.all([fetchCategories(), fetchAllPhotos()]);
      setCategories(cats);
      setPhotos(pics);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) loadData();
  }, [user, authLoading, navigate, loadData]);

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({ title: "No files selected", variant: "destructive" });
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(selectedFiles)) {
      const ext = file.name.split(".").pop();
      const filePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const isVideo = file.type.startsWith("video/");

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({ title: `Failed to upload ${file.name}`, description: uploadError.message, variant: "destructive" });
        continue;
      }

      // Get image dimensions
      let width: number | null = null;
      let height: number | null = null;

      if (!isVideo) {
        try {
          const dims = await getImageDimensions(file);
          width = dims.width;
          height = dims.height;
        } catch {}
      }

      // Insert photo record
      const { error: insertError } = await supabase.from("gallery_photos").insert({
        file_path: filePath,
        alt_text: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category_id: uploadCategory || null,
        photographer: uploadPhotographer || null,
        client: uploadClient || null,
        location: uploadLocation || null,
        is_video: isVideo,
        width,
        height,
        uploaded_by: user?.id,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      successCount++;
    }

    toast({ title: `Uploaded ${successCount} file(s)` });
    setSelectedFiles(null);
    setUploading(false);

    // Reset file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    loadData();
  };

  const handleDeletePhoto = async (photo: GalleryPhoto) => {
    const { error: storageError } = await supabase.storage
      .from("gallery")
      .remove([photo.file_path]);

    if (storageError) console.error("Storage delete error:", storageError);

    const { error } = await supabase.from("gallery_photos").delete().eq("id", photo.id);

    if (error) {
      toast({ title: "Failed to delete photo", variant: "destructive" });
      return;
    }

    toast({ title: "Photo deleted" });
    loadData();
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;

    const slug = newCatName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);

    const { error } = await supabase.from("gallery_categories").insert({
      name: newCatName.trim(),
      slug,
      description: newCatDescription.trim() || null,
      sort_order: maxOrder + 1,
    });

    if (error) {
      toast({ title: "Failed to add category", description: error.message, variant: "destructive" });
      return;
    }

    setNewCatName("");
    setNewCatDescription("");
    toast({ title: "Category added" });
    loadData();
  };

  const handleDeleteCategory = async (cat: GalleryCategory) => {
    const { error } = await supabase.from("gallery_categories").delete().eq("id", cat.id);
    if (error) {
      toast({ title: "Failed to delete category", variant: "destructive" });
      return;
    }
    toast({ title: "Category deleted" });
    loadData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-inter text-sm uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <SEO title="Admin - Gallery CMS" description="Manage your gallery" canonicalUrl="/admin" />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="font-playfair text-2xl text-foreground">Gallery CMS</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-inter">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 font-inter text-xs uppercase tracking-widest">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-border px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("photos")}
              className={`py-3 text-xs uppercase tracking-widest font-inter border-b-2 transition-colors ${
                activeTab === "photos" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Photos ({photos.length})
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-3 text-xs uppercase tracking-widest font-inter border-b-2 transition-colors ${
                activeTab === "categories" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Categories ({categories.length})
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {activeTab === "photos" && (
            <div className="space-y-8">
              {/* Upload Section */}
              <div className="border border-border p-6 space-y-4">
                <h2 className="font-inter text-xs uppercase tracking-widest text-muted-foreground">Upload Photos</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload" className="font-inter text-xs uppercase tracking-widest">Files</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="font-inter"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-inter text-xs uppercase tracking-widest">Category</Label>
                    <Select value={uploadCategory} onValueChange={setUploadCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-inter text-xs uppercase tracking-widest">Photographer</Label>
                    <Input
                      value={uploadPhotographer}
                      onChange={(e) => setUploadPhotographer(e.target.value)}
                      placeholder="Photographer name"
                      className="font-inter"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-inter text-xs uppercase tracking-widest">Client</Label>
                    <Input
                      value={uploadClient}
                      onChange={(e) => setUploadClient(e.target.value)}
                      placeholder="Client name"
                      className="font-inter"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-inter text-xs uppercase tracking-widest">Location</Label>
                    <Input
                      value={uploadLocation}
                      onChange={(e) => setUploadLocation(e.target.value)}
                      placeholder="Shot location"
                      className="font-inter"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFiles}
                  className="gap-2 font-inter text-xs uppercase tracking-widest"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => {
                  const cat = categories.find((c) => c.id === photo.category_id);
                  return (
                    <div key={photo.id} className="group relative border border-border overflow-hidden">
                      <img
                        src={getPublicUrl(photo.thumbnail_path || photo.file_path)}
                        alt={photo.alt_text}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-inter text-foreground truncate">
                          {photo.title || photo.alt_text}
                        </p>
                        {cat && (
                          <p className="text-[10px] font-inter uppercase tracking-widest text-muted-foreground">
                            {cat.name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePhoto(photo)}
                        className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {photos.length === 0 && (
                <p className="text-center text-muted-foreground font-inter text-sm py-12">
                  No photos uploaded yet. Upload your first photo above.
                </p>
              )}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-8">
              {/* Add Category */}
              <div className="border border-border p-6 space-y-4">
                <h2 className="font-inter text-xs uppercase tracking-widest text-muted-foreground">Add Category</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-inter text-xs uppercase tracking-widest">Name</Label>
                    <Input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="font-inter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-inter text-xs uppercase tracking-widest">Description</Label>
                    <Input
                      value={newCatDescription}
                      onChange={(e) => setNewCatDescription(e.target.value)}
                      placeholder="Optional description"
                      className="font-inter"
                    />
                  </div>
                </div>
                <Button onClick={handleAddCategory} className="gap-2 font-inter text-xs uppercase tracking-widest">
                  <Plus className="w-4 h-4" /> Add Category
                </Button>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                {categories.map((cat) => {
                  const photoCount = photos.filter((p) => p.category_id === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between border border-border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-inter text-sm text-foreground">{cat.name}</p>
                          <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">
                            /{cat.slug} · {photoCount} photos
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default Admin;
