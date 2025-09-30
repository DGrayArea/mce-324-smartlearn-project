import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  BookOpen,
  Video,
  FileImage,
  File,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface StudentCourseOption {
  id: string;
  code: string;
  title: string;
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  documentType:
    | "LECTURE_NOTE"
    | "VIDEO"
    | "AUDIO"
    | "PRESENTATION"
    | "ASSIGNMENT"
    | "OTHER";
  week?: number | null;
  topic?: string | null;
  tags?: string[] | null;
  downloadCount: number;
  uploadedAt: string;
  fileName?: string | null;
}

// Helper function to check admin roles
const isAdmin = (role: string | undefined) => {
  if (!role) return false;
  const adminRoles = ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"];
  return adminRoles.includes(role);
};

const ContentLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [courses, setCourses] = useState<StudentCourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const handleDelete = (item: ContentItem) => {
    setContent((prev) => prev.filter((c) => c.id !== item.id));

    toast({
      title: "Content Deleted",
      description: `${item.title} has been removed from the library.`,
      variant: "destructive",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "LECTURE_NOTE":
        return <FileText className="h-4 w-4" />;
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "AUDIO":
        return <File className="h-4 w-4" />;
      case "PRESENTATION":
        return <BookOpen className="h-4 w-4" />;
      case "ASSIGNMENT":
        return <File className="h-4 w-4" />;
      case "OTHER":
        return <FileText className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "image":
        return <FileImage className="h-4 w-4" />;
      case "presentation":
        return <BookOpen className="h-4 w-4" />;
      case "assignment":
        return <File className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const display = {
      LECTURE_NOTE: "Lecture Note",
      VIDEO: "Video",
      AUDIO: "Audio",
      PRESENTATION: "Presentation",
      ASSIGNMENT: "Assignment",
      OTHER: "Other",
    } as const;

    const variants = {
      LECTURE_NOTE: "default",
      VIDEO: "secondary",
      AUDIO: "outline",
      PRESENTATION: "default",
      ASSIGNMENT: "destructive",
      OTHER: "outline",
    } as const;

    const key = (type as keyof typeof variants) ?? "LECTURE_NOTE";
    return <Badge variant={variants[key]}>{display[key]}</Badge>;
  };

  const [content, setContent] = useState<ContentItem[]>([]);

  // Fetch enrolled courses for the student
  useEffect(() => {
    if (user?.role !== "STUDENT") return;
    const run = async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch("/api/student/enrolled-courses");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load courses");
        const options: StudentCourseOption[] = (
          data?.enrolledCourses || []
        ).map((c: any) => ({ id: c.id, code: c.code, title: c.title }));
        setCourses(options);
        if (options.length > 0) setSelectedCourseId(options[0].id);
      } catch (e) {
        console.error(e);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    run();
  }, [user?.role]);

  // Fetch content for selected course
  useEffect(() => {
    const run = async () => {
      if (!selectedCourseId) {
        setContent([]);
        return;
      }
      try {
        setLoadingContent(true);
        const res = await fetch(
          `/api/student/content?courseId=${encodeURIComponent(selectedCourseId)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load content");
        setContent((data?.content || []) as ContentItem[]);
      } catch (e) {
        console.error(e);
        setContent([]);
      } finally {
        setLoadingContent(false);
      }
    };
    run();
  }, [selectedCourseId]);

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (item.topic || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags || []).some((tag) =>
        (tag || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesType =
      selectedType === "all" || item.documentType === selectedType;

    return matchesSearch && matchesType;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Simulate file upload
    toast({
      title: "File Uploaded Successfully",
      description: `${uploadFile.name} has been uploaded to the content library.`,
    });

    setIsUploadOpen(false);
    setUploadFile(null);
  };

  const handleDownload = async (item: ContentItem) => {
    setDownloading(item.id);
    try {
      // Track download and get file info
      const res = await fetch("/api/student/content/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId: item.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Download failed");
      }

      // Fetch the file as a blob to ensure proper download
      const fileResponse = await fetch(data.fileUrl);
      const blob = await fileResponse.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName || item.fileName || item.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);

      // Update the download count in the UI
      setContent((prevContent) =>
        prevContent.map((content) =>
          content.id === item.id
            ? { ...content, downloadCount: data.downloadCount }
            : content
        )
      );

      toast({
        title: "Download Complete",
        description: `${item.title} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download Failed",
        description:
          error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (item: ContentItem) => {
    // Simulate file preview
    toast({
      title: "Preview",
      description: `Opening preview for ${item.title} (demo mode)`,
    });
  };

  const courseOptions = useMemo(() => courses, [courses]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Library</h2>
          <p className="text-muted-foreground">
            Access and manage course materials, resources, and assignments.
          </p>
        </div>
        {(user?.role === "LECTURER" || isAdmin(user?.role)) && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Content</DialogTitle>
                <DialogDescription>
                  Add new files to the content library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content-title">Title</Label>
                  <Input id="content-title" placeholder="Enter content title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-course">Course</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CS101">CS101</SelectItem>
                      <SelectItem value="CS201">CS201</SelectItem>
                      <SelectItem value="CS301">CS301</SelectItem>
                      <SelectItem value="CS302">CS302</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-file">File</Label>
                  <Input
                    id="content-file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.jpg,.png,.jpeg"
                  />
                  {uploadFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {uploadFile.name} (
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-description">Description</Label>
                  <Textarea
                    id="content-description"
                    placeholder="Describe the content"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-tags">Tags (comma separated)</Label>
                  <Input
                    id="content-tags"
                    placeholder="e.g., programming, tutorial, basics"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsUploadOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUploadSubmit}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="LECTURE_NOTE">Lecture Notes</SelectItem>
            <SelectItem value="ASSIGNMENT">Assignments</SelectItem>
            <SelectItem value="PRESENTATION">Presentations</SelectItem>
            <SelectItem value="VIDEO">Videos</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            {loadingCourses ? (
              <SelectItem value="load" disabled>
                Loading...
              </SelectItem>
            ) : courseOptions.length === 0 ? (
              <SelectItem value="load" disabled>
                No courses
              </SelectItem>
            ) : (
              courseOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Content Grid */}
      {loadingContent ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.documentType)}
                    {getTypeBadge(item.documentType)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <CardTitle className="text-lg font-semibold">
                  {item.title}
                </CardTitle>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {(item.tags || []).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>{new Date(item.uploadedAt).toLocaleDateString()}</div>
                  <div>{item.downloadCount} downloads</div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(item)}
                    disabled={downloading === item.id}
                  >
                    {downloading === item.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default withDashboardLayout(ContentLibrary);
