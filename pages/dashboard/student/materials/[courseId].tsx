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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Eye,
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Tag,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const StudentCourseMaterials = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterWeek, setFilterWeek] = useState("ALL");

  useEffect(() => {
    if (courseId && user?.role === "STUDENT") {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const courseResponse = await fetch("/api/student/course-registration");
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        const currentCourse = courseData.currentEnrollments?.find(
          (enrollment: any) => enrollment.course.id === courseId
        );
        if (currentCourse) {
          setCourse(currentCourse.course);
        }
      }

      // Fetch documents
      const docsResponse = await fetch(
        `/api/student/documents?courseId=${courseId}`
      );
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.documents || []);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: any) => {
    try {
      const response = await fetch("/api/student/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (response.ok) {
        const data = await response.json();

        // Create download link
        const link = document.createElement("a");
        link.href = data.document.fileUrl;
        link.download = data.document.fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download Started",
          description: `Downloading ${data.document.fileName}`,
        });
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "LECTURE_NOTE":
        return "📝";
      case "ASSIGNMENT":
        return "📋";
      case "PRESENTATION":
        return "📊";
      case "VIDEO":
        return "🎥";
      case "AUDIO":
        return "🎵";
      default:
        return "📄";
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case "LECTURE_NOTE":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNMENT":
        return "bg-orange-100 text-orange-800";
      case "PRESENTATION":
        return "bg-purple-100 text-purple-800";
      case "VIDEO":
        return "bg-red-100 text-red-800";
      case "AUDIO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || doc.documentType === filterType;
    const matchesWeek =
      filterWeek === "ALL" || doc.week?.toString() === filterWeek;

    return matchesSearch && matchesType && matchesWeek;
  });

  const uniqueWeeks = [
    ...new Set(documents.map((doc) => doc.week).filter(Boolean)),
  ].sort((a, b) => a - b);
  const documentTypes = [...new Set(documents.map((doc) => doc.documentType))];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">
          Loading course materials...
        </p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
        <p className="text-muted-foreground">
          You don&apos;t have access to this course or it doesn&apos;t exist.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/courses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
          <p className="text-muted-foreground">
            {course.code} • {course.creditUnit} Credits
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {course.description}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/courses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterWeek} onValueChange={setFilterWeek}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Weeks</SelectItem>
                  {uniqueWeeks.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {getDocumentTypeIcon(doc.documentType)}
                  </span>
                  <Badge className={getDocumentTypeColor(doc.documentType)}>
                    {doc.documentType.replace("_", " ")}
                  </Badge>
                </div>
                {doc.week && (
                  <Badge variant="outline" className="text-xs">
                    Week {doc.week}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{doc.title}</CardTitle>
              {doc.description && (
                <CardDescription className="line-clamp-2">
                  {doc.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{doc.fileName}</span>
                  <span>{Math.round(doc.fileSize / 1024)} KB</span>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{doc.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(doc.fileUrl, "_blank")}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Materials Found</h3>
            <p className="text-muted-foreground">
              {documents.length === 0
                ? "No materials have been uploaded for this course yet."
                : "No materials match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default withDashboardLayout(StudentCourseMaterials);
