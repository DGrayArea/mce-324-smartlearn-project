import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Users,
  Award,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calculator,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const LecturerCourseManagement = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Document upload states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    documentType: "LECTURE_NOTE",
    week: "",
    topic: "",
    tags: "",
  });

  // Quiz creation states
  const [quizOpen, setQuizOpen] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    type: "PRACTICE",
    totalPoints: 100,
    timeLimit: "",
    attempts: 1,
    startDate: "",
    endDate: "",
    isRandomized: false,
    showResults: true,
  });
  const [questions, setQuestions] = useState<any[]>([]);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch course details
      const courseResponse = await fetch("/api/lecturer/courses");
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        const currentCourse = courseData.courses.find(
          (c: any) => c.id === courseId
        );
        setCourse(currentCourse);
      }

      // Fetch documents
      const docsResponse = await fetch(
        `/api/lecturer/documents?courseId=${courseId}`
      );
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.documents || []);
      }

      // Fetch quizzes
      const quizzesResponse = await fetch(
        `/api/lecturer/quizzes?courseId=${courseId}`
      );
      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json();
        setQuizzes(quizzesData.quizzes || []);
      }

      // Fetch students (enrolled in this course)
      const studentsResponse = await fetch(
        `/api/lecturer/students?courseId=${courseId}`
      );
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students || []);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    if (courseId && user?.role === "LECTURER") {
      fetchCourseData();
    }
  }, [courseId, user, fetchCourseData]);

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      const fileInput = document.getElementById("file") as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (!file) {
        toast({
          title: "Error",
          description: "Please select a file to upload",
          variant: "destructive",
        });
        return;
      }

      formData.append("file", file);
      formData.append("courseId", courseId as string);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("documentType", uploadForm.documentType);
      formData.append("week", uploadForm.week);
      formData.append("topic", uploadForm.topic);
      formData.append("tags", uploadForm.tags);

      const response = await fetch("/api/lecturer/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });
        setUploadOpen(false);
        setUploadForm({
          title: "",
          description: "",
          documentType: "LECTURE_NOTE",
          week: "",
          topic: "",
          tags: "",
        });
        fetchCourseData();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(
        `/api/lecturer/documents?documentId=${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
        fetchCourseData();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "MULTIPLE_CHOICE",
        points: 1,
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || questions.length === 0) return;

    setCreatingQuiz(true);
    try {
      const response = await fetch("/api/lecturer/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          ...quizForm,
          questions,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Quiz created successfully",
        });
        setQuizOpen(false);
        setQuizForm({
          title: "",
          description: "",
          type: "PRACTICE",
          totalPoints: 100,
          timeLimit: "",
          attempts: 1,
          startDate: "",
          endDate: "",
          isRandomized: false,
          showResults: true,
        });
        setQuestions([]);
        fetchCourseData();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Quiz creation failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz",
        variant: "destructive",
      });
    } finally {
      setCreatingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">
          Loading course data...
        </p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
        <p className="text-muted-foreground">
          The requested course could not be found or you don&apos;t have access
          to it.
        </p>
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
            {course.code} • {course.creditUnit} Credits • {course.studentCount}{" "}
            Students
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {course.description}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {course.department.name}
        </Badge>
      </div>

      {/* Course Management Tabs */}
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">
            <FileText className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <Award className="h-4 w-4 mr-2" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="grades">
            <Calculator className="h-4 w-4 mr-2" />
            Grades
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Course Materials</h3>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Course Material</DialogTitle>
                  <DialogDescription>
                    Upload lecture notes, assignments, or other course
                    materials.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleDocumentUpload} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={uploadForm.title}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentType">Type</Label>
                      <Select
                        value={uploadForm.documentType}
                        onValueChange={(value) =>
                          setUploadForm({ ...uploadForm, documentType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LECTURE_NOTE">
                            Lecture Note
                          </SelectItem>
                          <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                          <SelectItem value="PRESENTATION">
                            Presentation
                          </SelectItem>
                          <SelectItem value="VIDEO">Video</SelectItem>
                          <SelectItem value="AUDIO">Audio</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="week">Week</Label>
                      <Input
                        id="week"
                        type="number"
                        value={uploadForm.week}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, week: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        value={uploadForm.topic}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            topic: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={uploadForm.tags}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, tags: e.target.value })
                      }
                      placeholder="e.g., introduction, basics, advanced"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      required
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.mp3,.zip"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Documents List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-xs">
                      {doc.documentType.replace("_", " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-sm">{doc.title}</CardTitle>
                  {doc.description && (
                    <CardDescription className="text-xs">
                      {doc.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{doc.fileName}</span>
                    <span>{Math.round(doc.fileSize / 1024)} KB</span>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Course Quizzes</h3>
            <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Quiz</DialogTitle>
                  <DialogDescription>
                    Create a quiz with multiple choice, true/false, or short
                    answer questions.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateQuiz} className="space-y-6">
                  {/* Quiz Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quizTitle">Title *</Label>
                      <Input
                        id="quizTitle"
                        value={quizForm.title}
                        onChange={(e) =>
                          setQuizForm({ ...quizForm, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quizType">Type</Label>
                      <Select
                        value={quizForm.type}
                        onValueChange={(value) =>
                          setQuizForm({ ...quizForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRACTICE">Practice</SelectItem>
                          <SelectItem value="GRADED">Graded</SelectItem>
                          <SelectItem value="MIDTERM">Midterm</SelectItem>
                          <SelectItem value="FINAL">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quizDescription">Description</Label>
                    <Textarea
                      id="quizDescription"
                      value={quizForm.description}
                      onChange={(e) =>
                        setQuizForm({
                          ...quizForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalPoints">Total Points</Label>
                      <Input
                        id="totalPoints"
                        type="number"
                        value={quizForm.totalPoints}
                        onChange={(e) =>
                          setQuizForm({
                            ...quizForm,
                            totalPoints: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={quizForm.timeLimit}
                        onChange={(e) =>
                          setQuizForm({
                            ...quizForm,
                            timeLimit: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attempts">Attempts Allowed</Label>
                      <Input
                        id="attempts"
                        type="number"
                        value={quizForm.attempts}
                        onChange={(e) =>
                          setQuizForm({
                            ...quizForm,
                            attempts: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={quizForm.startDate}
                        onChange={(e) =>
                          setQuizForm({
                            ...quizForm,
                            startDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={quizForm.endDate}
                        onChange={(e) =>
                          setQuizForm({ ...quizForm, endDate: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Questions</h4>
                      <Button
                        type="button"
                        onClick={addQuestion}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                    {questions.map((question, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium">
                              Question {index + 1}
                            </h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Question Text *</Label>
                              <Textarea
                                value={question.question}
                                onChange={(e) =>
                                  updateQuestion(
                                    index,
                                    "question",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={question.type}
                                onValueChange={(value) =>
                                  updateQuestion(index, "type", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MULTIPLE_CHOICE">
                                    Multiple Choice
                                  </SelectItem>
                                  <SelectItem value="TRUE_FALSE">
                                    True/False
                                  </SelectItem>
                                  <SelectItem value="SHORT_ANSWER">
                                    Short Answer
                                  </SelectItem>
                                  <SelectItem value="ESSAY">Essay</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={question.points}
                                onChange={(e) =>
                                  updateQuestion(
                                    index,
                                    "points",
                                    parseFloat(e.target.value)
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Correct Answer *</Label>
                              <Input
                                value={question.correctAnswer}
                                onChange={(e) =>
                                  updateQuestion(
                                    index,
                                    "correctAnswer",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          </div>
                          {question.type === "MULTIPLE_CHOICE" && (
                            <div className="space-y-2">
                              <Label>Options</Label>
                              {question.options.map(
                                (option: string, optionIndex: number) => (
                                  <Input
                                    key={optionIndex}
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      newOptions[optionIndex] = e.target.value;
                                      updateQuestion(
                                        index,
                                        "options",
                                        newOptions
                                      );
                                    }}
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                )
                              )}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Explanation (optional)</Label>
                            <Textarea
                              value={question.explanation}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "explanation",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQuizOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creatingQuiz || questions.length === 0}
                    >
                      {creatingQuiz ? "Creating..." : "Create Quiz"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quizzes List */}
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription>{quiz.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{quiz.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      <span>{quiz.totalPoints} points</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{quiz.timeLimit || "No limit"} min</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{quiz._count.quizAttempts} attempts</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(quiz.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/lecturer/grade/${quiz.id}`)
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Attempts
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/lecturer/grade/${quiz.id}`)
                      }
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Grade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Enrolled Students</h3>
            <Badge variant="outline">{students.length} Students</Badge>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Matric Number</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.matricNumber}</TableCell>
                    <TableCell>{student.level}</TableCell>
                    <TableCell>
                      {new Date(student.enrolledAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={student.isActive ? "default" : "secondary"}
                      >
                        {student.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Progress
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">End-of-Semester Grades</h3>
            <Button
              onClick={() =>
                router.push(`/dashboard/lecturer/grades/${courseId}`)
              }
            >
              <Calculator className="h-4 w-4 mr-2" />
              Manage Grades
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Grade Management</h4>
                <p className="text-muted-foreground mb-4">
                  Manage end-of-semester grades for all enrolled students. Enter
                  CA and exam scores, then submit to department admin for
                  review.
                </p>
                <Button
                  onClick={() =>
                    router.push(`/dashboard/lecturer/grades/${courseId}`)
                  }
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Open Grade Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withDashboardLayout(LecturerCourseManagement);
