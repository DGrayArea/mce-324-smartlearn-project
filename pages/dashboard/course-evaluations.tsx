import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { withDashboardLayout } from "@/lib/layoutWrappers";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  Calendar,
  BookOpen,
  GraduationCap,
} from "lucide-react";

interface CourseEvaluation {
  id: string;
  contentQuality: number;
  teachingMethod: number;
  courseOrganization: number;
  materialRelevance: number;
  overallRating: number;
  likes?: string;
  improvements?: string;
  additionalComments?: string;
  wouldRecommend: boolean;
  isAnonymous: boolean;
  submittedAt: string;
  student: {
    id: string;
    name: string;
    studentId: string;
  };
  course: {
    id: string;
    title: string;
    code: string;
  };
  lecturer: {
    id: string;
    name: string;
  };
}

interface Course {
  id: string;
  title: string;
  code: string;
}

interface Lecturer {
  id: string;
  name: string;
}

const CourseEvaluations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedLecturer, setSelectedLecturer] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] =
    useState<CourseEvaluation | null>(null);
  const [formData, setFormData] = useState({
    courseId: "",
    lecturerId: "",
    academicYear: "",
    semester: "",
    contentQuality: "",
    teachingMethod: "",
    courseOrganization: "",
    materialRelevance: "",
    overallRating: "",
    likes: "",
    improvements: "",
    additionalComments: "",
    wouldRecommend: false,
    isAnonymous: true,
  });

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCourse) params.append("courseId", selectedCourse);
      if (selectedLecturer) params.append("lecturerId", selectedLecturer);

      const response = await fetch(
        `/api/evaluations/course-evaluations?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data.evaluations);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch course evaluations",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch course evaluations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedLecturer, toast]);

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      fetchEvaluations();
    }
  }, [courses, selectedCourse, selectedLecturer, fetchEvaluations]);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/lecturer/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        // If lecturer courses fail, try student courses
        const studentResponse = await fetch("/api/student/courses");
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          setCourses(studentData.courses || []);
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=LECTURER");
      if (response.ok) {
        const data = await response.json();
        setLecturers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error);
    }
  };

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/evaluations/course-evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course evaluation submitted successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          courseId: "",
          lecturerId: "",
          academicYear: "",
          semester: "",
          contentQuality: "",
          teachingMethod: "",
          courseOrganization: "",
          materialRelevance: "",
          overallRating: "",
          likes: "",
          improvements: "",
          additionalComments: "",
          wouldRecommend: false,
          isAnonymous: true,
        });
        fetchEvaluations();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to submit evaluation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to submit evaluation",
        variant: "destructive",
      });
    }
  };

  const handleEditEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvaluation) return;

    try {
      const response = await fetch("/api/evaluations/course-evaluations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluationId: editingEvaluation.id,
          contentQuality: formData.contentQuality,
          teachingMethod: formData.teachingMethod,
          courseOrganization: formData.courseOrganization,
          materialRelevance: formData.materialRelevance,
          overallRating: formData.overallRating,
          likes: formData.likes,
          improvements: formData.improvements,
          additionalComments: formData.additionalComments,
          wouldRecommend: formData.wouldRecommend,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course evaluation updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingEvaluation(null);
        setFormData({
          courseId: "",
          lecturerId: "",
          academicYear: "",
          semester: "",
          contentQuality: "",
          teachingMethod: "",
          courseOrganization: "",
          materialRelevance: "",
          overallRating: "",
          likes: "",
          improvements: "",
          additionalComments: "",
          wouldRecommend: false,
          isAnonymous: true,
        });
        fetchEvaluations();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update evaluation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to update evaluation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm("Are you sure you want to delete this evaluation?")) return;

    try {
      const response = await fetch(
        `/api/evaluations/course-evaluations?evaluationId=${evaluationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course evaluation deleted successfully",
        });
        fetchEvaluations();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete evaluation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to delete evaluation",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (evaluation: CourseEvaluation) => {
    setEditingEvaluation(evaluation);
    setFormData({
      courseId: evaluation.course.id,
      lecturerId: evaluation.lecturer.id,
      academicYear: "",
      semester: "",
      contentQuality: evaluation.contentQuality.toString(),
      teachingMethod: evaluation.teachingMethod.toString(),
      courseOrganization: evaluation.courseOrganization.toString(),
      materialRelevance: evaluation.materialRelevance.toString(),
      overallRating: evaluation.overallRating.toString(),
      likes: evaluation.likes || "",
      improvements: evaluation.improvements || "",
      additionalComments: evaluation.additionalComments || "",
      wouldRecommend: evaluation.wouldRecommend,
      isAnonymous: evaluation.isAnonymous,
    });
    setIsEditDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
  };

  const filteredEvaluations = evaluations.filter(
    (evaluation) =>
      evaluation.course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      evaluation.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.lecturer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateEvaluation = user?.role === "STUDENT";
  const canViewAllEvaluations = user?.role && !["STUDENT"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Course Evaluations
          </h2>
          <p className="text-muted-foreground">
            {canCreateEvaluation
              ? "Evaluate your courses and provide feedback to lecturers"
              : "View course evaluations and feedback from students"}
          </p>
        </div>
        {canCreateEvaluation && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit Evaluation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Course Evaluation</DialogTitle>
                <DialogDescription>
                  Provide feedback about your course experience
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvaluation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Select
                      value={formData.courseId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, courseId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="lecturer">Lecturer</Label>
                    <Select
                      value={formData.lecturerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, lecturerId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lecturer" />
                      </SelectTrigger>
                      <SelectContent>
                        {lecturers.map((lecturer) => (
                          <SelectItem key={lecturer.id} value={lecturer.id}>
                            {lecturer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academicYear: e.target.value,
                        })
                      }
                      placeholder="e.g., 2023/2024"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(value) =>
                        setFormData({ ...formData, semester: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIRST">First Semester</SelectItem>
                        <SelectItem value="SECOND">Second Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Rating Criteria (1-5 scale)
                  </h3>

                  <div>
                    <Label>Content Quality</Label>
                    <RadioGroup
                      value={formData.contentQuality}
                      onValueChange={(value) =>
                        setFormData({ ...formData, contentQuality: value })
                      }
                      className="flex space-x-4"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={rating.toString()}
                            id={`content-${rating}`}
                          />
                          <Label htmlFor={`content-${rating}`}>{rating}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Teaching Method</Label>
                    <RadioGroup
                      value={formData.teachingMethod}
                      onValueChange={(value) =>
                        setFormData({ ...formData, teachingMethod: value })
                      }
                      className="flex space-x-4"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={rating.toString()}
                            id={`teaching-${rating}`}
                          />
                          <Label htmlFor={`teaching-${rating}`}>{rating}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Course Organization</Label>
                    <RadioGroup
                      value={formData.courseOrganization}
                      onValueChange={(value) =>
                        setFormData({ ...formData, courseOrganization: value })
                      }
                      className="flex space-x-4"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={rating.toString()}
                            id={`organization-${rating}`}
                          />
                          <Label htmlFor={`organization-${rating}`}>
                            {rating}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Material Relevance</Label>
                    <RadioGroup
                      value={formData.materialRelevance}
                      onValueChange={(value) =>
                        setFormData({ ...formData, materialRelevance: value })
                      }
                      className="flex space-x-4"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={rating.toString()}
                            id={`material-${rating}`}
                          />
                          <Label htmlFor={`material-${rating}`}>{rating}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Overall Rating</Label>
                    <RadioGroup
                      value={formData.overallRating}
                      onValueChange={(value) =>
                        setFormData({ ...formData, overallRating: value })
                      }
                      className="flex space-x-4"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={rating.toString()}
                            id={`overall-${rating}`}
                          />
                          <Label htmlFor={`overall-${rating}`}>{rating}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Feedback</h3>

                  <div>
                    <Label htmlFor="likes">
                      What did you like about this course?
                    </Label>
                    <Textarea
                      id="likes"
                      value={formData.likes}
                      onChange={(e) =>
                        setFormData({ ...formData, likes: e.target.value })
                      }
                      placeholder="Share what you enjoyed..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="improvements">
                      What could be improved?
                    </Label>
                    <Textarea
                      id="improvements"
                      value={formData.improvements}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          improvements: e.target.value,
                        })
                      }
                      placeholder="Suggest improvements..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalComments">
                      Additional Comments
                    </Label>
                    <Textarea
                      id="additionalComments"
                      value={formData.additionalComments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          additionalComments: e.target.value,
                        })
                      }
                      placeholder="Any other feedback..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wouldRecommend"
                      checked={formData.wouldRecommend}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, wouldRecommend: !!checked })
                      }
                    />
                    <Label htmlFor="wouldRecommend">
                      I would recommend this course to other students
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAnonymous"
                      checked={formData.isAnonymous}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isAnonymous: !!checked })
                      }
                    />
                    <Label htmlFor="isAnonymous">Submit anonymously</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Submit Evaluation</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search evaluations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        {canViewAllEvaluations && (
          <>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedLecturer}
              onValueChange={setSelectedLecturer}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by lecturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Lecturers</SelectItem>
                {lecturers.map((lecturer) => (
                  <SelectItem key={lecturer.id} value={lecturer.id}>
                    {lecturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">
                        {evaluation.course.title}
                      </CardTitle>
                      <Badge variant="outline">{evaluation.course.code}</Badge>
                      {evaluation.wouldRecommend && (
                        <Badge variant="default">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      {evaluation.isAnonymous && (
                        <Badge variant="secondary">Anonymous</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Lecturer: {evaluation.lecturer.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    {evaluation.student.id === user?.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(evaluation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvaluation(evaluation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Content Quality
                    </Label>
                    {renderStars(evaluation.contentQuality)}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Teaching Method
                    </Label>
                    {renderStars(evaluation.teachingMethod)}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Course Organization
                    </Label>
                    {renderStars(evaluation.courseOrganization)}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Material Relevance
                    </Label>
                    {renderStars(evaluation.materialRelevance)}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Overall Rating
                    </Label>
                    {renderStars(evaluation.overallRating)}
                  </div>
                </div>

                {(evaluation.likes ||
                  evaluation.improvements ||
                  evaluation.additionalComments) && (
                  <div className="space-y-3">
                    {evaluation.likes && (
                      <div>
                        <Label className="text-sm font-medium text-green-600">
                          What they liked:
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {evaluation.likes}
                        </p>
                      </div>
                    )}
                    {evaluation.improvements && (
                      <div>
                        <Label className="text-sm font-medium text-orange-600">
                          Improvements suggested:
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {evaluation.improvements}
                        </p>
                      </div>
                    )}
                    {evaluation.additionalComments && (
                      <div>
                        <Label className="text-sm font-medium text-blue-600">
                          Additional comments:
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {evaluation.additionalComments}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {evaluation.isAnonymous
                        ? "Anonymous Student"
                        : evaluation.student.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(evaluation.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredEvaluations.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Course Evaluations
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "No evaluations match your search criteria."
                : canCreateEvaluation
                  ? "You haven't submitted any course evaluations yet."
                  : "No course evaluations have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default withDashboardLayout(CourseEvaluations);
