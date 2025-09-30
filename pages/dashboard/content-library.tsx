import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
  ArrowLeft,
  Calendar,
  User,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  week?: number;
  topic?: string;
  tags?: string[];
  downloadCount: number;
  uploadedAt: string;
  courseId: string;
  course?: {
    id: string;
    title: string;
    code: string;
    level: string;
    semester: string;
  };
}

interface Course {
  id: string;
  title: string;
  code: string;
  level: string;
  semester: string;
  department?: {
    name: string;
    code: string;
  };
}

const ContentLibrary = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get course ID from query parameters
  const { course: courseId } = router.query;

  const [content, setContent] = useState<ContentItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<"FIRST" | "SECOND">(
    "FIRST"
  );
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(
    null
  );
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    documentType: "",
    week: "",
    topic: "",
    tags: "",
  });

  // Fetch courses for the lecturer
  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const res = await fetch("/api/lecturer/courses");
        const data = await res.json();
        if (res.ok) {
          setCourses(data.courses || []);

          // If courseId is provided, find and select that course
          if (courseId && data.courses) {
            const course = data.courses.find((c: Course) => c.id === courseId);
            if (course) {
              setSelectedCourse(course);
              setSelectedSemester(course.semester as "FIRST" | "SECOND");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({
          title: "Error",
          description: "Failed to fetch courses",
          variant: "destructive",
        });
      } finally {
        setCoursesLoading(false);
      }
    };

    if (user?.role === "LECTURER") {
      fetchCourses();
    } else {
      setCoursesLoading(false);
    }
  }, [courseId, user?.role, toast]);

  // Fetch content for selected course
  useEffect(() => {
    const fetchContent = async () => {
      if (!selectedCourse) {
        setContent([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `/api/lecturer/content?courseId=${selectedCourse.id}`
        );
        const data = await res.json();
        if (res.ok) {
          setContent(data.content || []);
        } else {
          throw new Error(data.message || "Failed to fetch content");
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        toast({
          title: "Error",
          description: "Failed to fetch course content",
          variant: "destructive",
        });
        setContent([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedCourse, toast]);

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
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      LECTURE_NOTE: "default",
      VIDEO: "secondary",
      AUDIO: "outline",
      PRESENTATION: "default",
      ASSIGNMENT: "destructive",
      OTHER: "outline",
    } as const;

    const displayNames = {
      LECTURE_NOTE: "Lecture Note",
      VIDEO: "Video",
      AUDIO: "Audio",
      PRESENTATION: "Presentation",
      ASSIGNMENT: "Assignment",
      OTHER: "Other",
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || "default"}>
        {displayNames[type as keyof typeof displayNames] || type}
      </Badge>
    );
  };

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.topic &&
        item.topic.toLowerCase().includes(searchQuery.toLowerCase()));

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

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedCourse) {
      toast({
        title: "Missing Information",
        description: "Please select a file and course.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadData.title || !uploadData.documentType) {
      toast({
        title: "Missing Information",
        description: "Please provide title and document type.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("courseId", selectedCourse.id);
      formData.append("title", uploadData.title);
      formData.append("description", uploadData.description);
      formData.append("documentType", uploadData.documentType);
      formData.append("week", uploadData.week);
      formData.append("topic", uploadData.topic);
      formData.append("tags", uploadData.tags);

      console.log("Uploading file:", uploadFile.name); // Debug log
      console.log("Document type being sent:", uploadData.documentType); // Debug log

      const res = await fetch("/api/lecturer/content", {
        method: "POST",
        body: formData, // Send FormData instead of JSON
      });

      const data = await res.json();
      console.log("Upload response:", data); // Debug log

      if (res.ok) {
        toast({
          title: "Upload Successful",
          description: `${uploadData.title} has been uploaded successfully.`,
        });

        // Reset form
        setUploadData({
          title: "",
          description: "",
          documentType: "",
          week: "",
          topic: "",
          tags: "",
        });
        setUploadFile(null);
        setIsUploadOpen(false);

        // Refresh content
        const contentRes = await fetch(
          `/api/lecturer/content?courseId=${selectedCourse.id}`
        );
        const contentData = await contentRes.json();
        if (contentRes.ok) {
          setContent(contentData.content || []);
        }
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: ContentItem) => {
    setEditingContent(item);
    setUploadData({
      title: item.title,
      description: item.description || "",
      documentType: item.documentType,
      week: item.week?.toString() || "",
      topic: item.topic || "",
      tags: item.tags?.join(", ") || "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingContent) return;

    try {
      const res = await fetch("/api/lecturer/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId: editingContent.id,
          title: uploadData.title,
          description: uploadData.description,
          documentType: uploadData.documentType,
          week: uploadData.week,
          topic: uploadData.topic,
          tags: uploadData.tags,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Content Updated",
          description: `${uploadData.title} has been updated successfully.`,
        });

        // Reset form and close modal
        setUploadData({
          title: "",
          description: "",
          documentType: "",
          week: "",
          topic: "",
          tags: "",
        });
        setEditingContent(null);
        setIsEditOpen(false);

        // Refresh content
        const contentRes = await fetch(
          `/api/lecturer/content?courseId=${selectedCourse?.id}`
        );
        const contentData = await contentRes.json();
        if (contentRes.ok) {
          setContent(contentData.content || []);
        }
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: ContentItem) => {
    try {
      const res = await fetch(`/api/lecturer/content?contentId=${item.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Content Deleted",
          description: `${item.title} has been removed.`,
          variant: "destructive",
        });

        // Remove from local state
        setContent((prev) => prev.filter((c) => c.id !== item.id));
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (item: ContentItem) => {
    setDownloading(item.id);
    try {
      console.log("Starting download for content:", item.id);

      // Track download and get file info
      const res = await fetch("/api/lecturer/content/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId: item.id,
        }),
      });

      console.log("Download API response status:", res.status);
      const data = await res.json();
      console.log("Download API response data:", data);

      if (!res.ok) {
        throw new Error(data.message || "Download failed");
      }

      // Create a proper download link with proper headers
      console.log("Triggering file download:", {
        fileUrl: data.fileUrl,
        fileName: data.fileName || item.title,
      });

      // Fetch the file as a blob to ensure proper download
      const fileResponse = await fetch(data.fileUrl);
      const blob = await fileResponse.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName || item.title;
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

  if (user?.role !== "LECTURER") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only lecturers can access the content library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/courses")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Content Library</h2>
          <p className="text-muted-foreground">
            Upload and manage course materials, resources, and assignments.
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            {uploading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Uploading content...
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogHeader>
              <DialogTitle>Upload New Content</DialogTitle>
              <DialogDescription>
                Add new files to {selectedCourse?.title || "the course"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content-title">Title *</Label>
                <Input
                  id="content-title"
                  placeholder="Enter content title"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-type">Document Type *</Label>
                <Select
                  value={uploadData.documentType}
                  onValueChange={(value) =>
                    setUploadData((prev) => ({ ...prev, documentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LECTURE_NOTE">Lecture Note</SelectItem>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="PRESENTATION">Presentation</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-week">Week</Label>
                <Input
                  id="content-week"
                  type="number"
                  placeholder="Week number"
                  value={uploadData.week}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, week: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-topic">Topic</Label>
                <Input
                  id="content-topic"
                  placeholder="Topic or subject"
                  value={uploadData.topic}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      topic: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-file">File *</Label>
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
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-tags">Tags (comma separated)</Label>
                <Input
                  id="content-tags"
                  placeholder="e.g., programming, tutorial, basics"
                  value={uploadData.tags}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button onClick={handleUploadSubmit} disabled={uploading}>
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Content Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
              <DialogDescription>
                Update the content information for {editingContent?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter content title"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Document Type *</Label>
                <Select
                  value={uploadData.documentType}
                  onValueChange={(value) =>
                    setUploadData((prev) => ({ ...prev, documentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LECTURE_NOTE">Lecture Note</SelectItem>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="PRESENTATION">Presentation</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-week">Week</Label>
                <Input
                  id="edit-week"
                  type="number"
                  placeholder="Week number"
                  value={uploadData.week}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, week: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-topic">Topic</Label>
                <Input
                  id="edit-topic"
                  placeholder="Topic or subject"
                  value={uploadData.topic}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      topic: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe the content"
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                <Input
                  id="edit-tags"
                  placeholder="e.g., programming, tutorial, basics"
                  value={uploadData.tags}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingContent(null);
                    setUploadData({
                      title: "",
                      description: "",
                      documentType: "",
                      week: "",
                      topic: "",
                      tags: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditSubmit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Selection */}
      {coursesLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your courses...</p>
          </CardContent>
        </Card>
      ) : courses.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
            <CardDescription>
              Choose a course to manage its content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={selectedSemester}
              onValueChange={(value) =>
                setSelectedSemester(value as "FIRST" | "SECOND")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="FIRST">First Semester</TabsTrigger>
                <TabsTrigger value="SECOND">Second Semester</TabsTrigger>
              </TabsList>

              {["FIRST", "SECOND"].map((semester) => {
                const semesterCourses = courses.filter(
                  (course) => course.semester === semester
                );

                return (
                  <TabsContent
                    key={semester}
                    value={semester}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {semester} Semester
                        <span className="ml-2 text-sm text-gray-500">
                          ({semesterCourses.length} course
                          {semesterCourses.length !== 1 ? "s" : ""})
                        </span>
                      </h3>
                    </div>

                    {semesterCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          No courses in {semester.toLowerCase()} semester.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {semesterCourses.map((course) => (
                          <Card
                            key={course.id}
                            className={`cursor-pointer transition-colors ${
                              selectedCourse?.id === course.id
                                ? "ring-2 ring-primary bg-primary/5"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              setSelectedCourse(course);
                              setSelectedSemester(
                                course.semester as "FIRST" | "SECOND"
                              );
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">
                                    {course.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {course.code} • {course.level} •{" "}
                                    {course.semester}
                                  </p>
                                  {course.department && (
                                    <p className="text-xs text-muted-foreground">
                                      {course.department.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Assigned</h3>
            <p className="text-muted-foreground">
              You don&apos;t have any courses assigned yet. Contact your
              department admin to get assigned to courses.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content Management */}
      {selectedCourse && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{selectedCourse.title}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCourse.code} • {selectedCourse.level} •{" "}
                {selectedCourse.semester}
              </p>
            </div>
            <Badge variant="outline">
              {content.length} content item{content.length !== 1 ? "s" : ""}
            </Badge>
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
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading content...</p>
              </div>
            </div>
          ) : filteredContent.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedType !== "all"
                    ? "No content matches your search criteria."
                    : "No content has been uploaded for this course yet."}
                </p>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload First Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-md transition-shadow"
                >
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

                    <div className="flex flex-wrap gap-2">
                      {item.week && (
                        <Badge variant="outline" className="text-xs">
                          Week {item.week}
                        </Badge>
                      )}
                      {item.topic && (
                        <Badge variant="outline" className="text-xs">
                          {item.topic}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {item.downloadCount} downloads
                      </div>
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
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
      )}
    </div>
  );
};

export default withDashboardLayout(ContentLibrary);
