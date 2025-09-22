import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import {
  HelpCircle,
  Plus,
  Search,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface Question {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  isResolved: boolean;
  viewCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  course: {
    id: string;
    title: string;
    code: string;
  };
  _count: {
    answers: number;
  };
}

interface Course {
  id: string;
  title: string;
  code: string;
}

const QABoards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    content: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      fetchQuestions();
    }
  }, [courses, selectedCourse, sortBy]);

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

  const fetchQuestions = async () => {
    if (!selectedCourse) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/qa/questions?courseId=${selectedCourse}&sortBy=${sortBy}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch questions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/qa/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Question posted successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          courseId: "",
          title: "",
          content: "",
        });
        fetchQuestions();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to post question",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast({
        title: "Error",
        description: "Failed to post question",
        variant: "destructive",
      });
    }
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      const response = await fetch("/api/qa/questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: editingQuestion.id,
          title: formData.title,
          content: formData.content,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingQuestion(null);
        setFormData({
          courseId: "",
          title: "",
          content: "",
        });
        fetchQuestions();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update question",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await fetch(
        `/api/qa/questions?questionId=${questionId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Question deleted successfully",
        });
        fetchQuestions();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete question",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      courseId: question.course.id,
      title: question.title,
      content: question.content,
    });
    setIsEditDialogOpen(true);
  };

  const filteredQuestions = questions.filter(
    (question) =>
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateQuestion =
    (user?.role && !["STUDENT"].includes(user.role)) ||
    user?.role === "STUDENT";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Q&A Boards</h2>
          <p className="text-muted-foreground">
            Ask questions and get answers from lecturers and peers
          </p>
        </div>
        {canCreateQuestion && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ask Question
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ask a Question</DialogTitle>
                <DialogDescription>
                  Post a question to get help from lecturers and other students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateQuestion} className="space-y-4">
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
                  <Label htmlFor="title">Question Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="What is your question about?"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Question Details</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Provide more details about your question..."
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Post Question</Button>
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
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-64">
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="most_voted">Most Voted</SelectItem>
            <SelectItem value="most_answered">Most Answered</SelectItem>
            <SelectItem value="unanswered">Unanswered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card
              key={question.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">
                        {question.title}
                      </CardTitle>
                      {question.isResolved && (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                      {question.isAnswered && !question.isResolved && (
                        <Badge variant="secondary">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Answered
                        </Badge>
                      )}
                      {!question.isAnswered && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Unanswered
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {question.content}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    {question.author.id === user?.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {question.author.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {question.viewCount} views
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {question._count.answers} answers
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{question.upvotes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{question.downvotes}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to question details
                        window.location.href = `/dashboard/qa/${question.id}`;
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredQuestions.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "No questions match your search criteria."
                : selectedCourse
                  ? "No questions have been asked for this course yet."
                  : "Select a course to view questions."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update your question</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditQuestion} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Question Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Question Details</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Question</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withDashboardLayout(QABoards);
