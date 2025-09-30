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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  ExternalLink,
  Users,
  MapPin,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface Course {
  id: string;
  title: string;
  code: string;
  semester: string;
  academicYear: string;
  level: number;
}

interface VirtualMeeting {
  id: string;
  title: string;
  description?: string;
  meetingUrl: string;
  scheduledAt: string;
  duration: number;
  isActive: boolean;
  course: {
    id: string;
    title: string;
    code: string;
  };
}

const VirtualMeetings = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { course: courseId } = router.query;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<"FIRST" | "SECOND">(
    "FIRST"
  );
  const [meetings, setMeetings] = useState<VirtualMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [meetingData, setMeetingData] = useState({
    title: "",
    description: "",
    meetingUrl: "",
    scheduledAt: "",
    duration: "60",
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

  // Fetch meetings for selected course
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!selectedCourse) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/lecturer/meetings?courseId=${selectedCourse.id}`
        );
        const data = await res.json();
        if (res.ok) {
          setMeetings(data.meetings || []);
        } else {
          throw new Error(data.message || "Failed to fetch meetings");
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
        toast({
          title: "Error",
          description: "Failed to fetch meetings",
          variant: "destructive",
        });
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [selectedCourse, toast]);

  const handleCreateMeeting = async () => {
    if (!selectedCourse) {
      toast({
        title: "Error",
        description: "Please select a course first",
        variant: "destructive",
      });
      return;
    }

    if (!meetingData.title || !meetingData.scheduledAt) {
      toast({
        title: "Error",
        description: "Title and scheduled time are required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/lecturer/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          ...meetingData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: `Virtual meeting created successfully! Notifications sent to ${data.notificationsSent} students.`,
        });

        // Reset form
        setMeetingData({
          title: "",
          description: "",
          meetingUrl: "",
          scheduledAt: "",
          duration: "60",
        });

        setIsCreateOpen(false);

        // Refresh meetings
        const meetingsRes = await fetch(
          `/api/lecturer/meetings?courseId=${selectedCourse.id}`
        );
        const meetingsData = await meetingsRes.json();
        if (meetingsRes.ok) {
          setMeetings(meetingsData.meetings || []);
        }
      } else {
        throw new Error(data.message || "Failed to create meeting");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create meeting",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const filteredCourses = courses.filter(
    (course) => course.semester === selectedSemester
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Virtual Meetings
          </h2>
          <p className="text-muted-foreground">
            Schedule and manage virtual classes for your courses.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Virtual Meeting</DialogTitle>
              <DialogDescription>
                Create a new virtual meeting for {selectedCourse?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Week 1 Lecture - Introduction"
                  value={meetingData.title}
                  onChange={(e) =>
                    setMeetingData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Meeting description and agenda..."
                  value={meetingData.description}
                  onChange={(e) =>
                    setMeetingData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Meeting URL *</Label>
                <Input
                  id="meetingUrl"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxxxxxx"
                  value={meetingData.meetingUrl}
                  onChange={(e) =>
                    setMeetingData((prev) => ({
                      ...prev,
                      meetingUrl: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={meetingData.scheduledAt}
                  onChange={(e) =>
                    setMeetingData((prev) => ({
                      ...prev,
                      scheduledAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  value={meetingData.duration}
                  onValueChange={(value) =>
                    setMeetingData((prev) => ({ ...prev, duration: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateMeeting} disabled={creating}>
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </>
                  )}
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
              Choose a course to manage its virtual meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={selectedSemester}
              onValueChange={(value) =>
                setSelectedSemester(value as "FIRST" | "SECOND")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="FIRST">First Semester</TabsTrigger>
                <TabsTrigger value="SECOND">Second Semester</TabsTrigger>
              </TabsList>
              <TabsContent value="FIRST" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map((course) => (
                    <Card
                      key={course.id}
                      className={`cursor-pointer transition-colors ${
                        selectedCourse?.id === course.id
                          ? "ring-2 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCourse(course)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {course.code}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{course.level}L</Badge>
                            <Badge variant="secondary">
                              {course.academicYear}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="SECOND" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map((course) => (
                    <Card
                      key={course.id}
                      className={`cursor-pointer transition-colors ${
                        selectedCourse?.id === course.id
                          ? "ring-2 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCourse(course)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {course.code}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{course.level}L</Badge>
                            <Badge variant="secondary">
                              {course.academicYear}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Assigned</h3>
            <p className="text-muted-foreground">
              You don&apos;t have any courses assigned yet. Contact your
              department admin to get assigned to courses.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle>Virtual Meetings - {selectedCourse.title}</CardTitle>
            <CardDescription>
              Manage virtual meetings for this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading meetings...</p>
              </div>
            ) : meetings.length > 0 ? (
              <div className="space-y-4">
                {meetings.map((meeting) => {
                  const { date, time } = formatDateTime(meeting.scheduledAt);
                  const upcoming = isUpcoming(meeting.scheduledAt);

                  return (
                    <Card
                      key={meeting.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {meeting.title}
                              </h3>
                              <Badge
                                variant={upcoming ? "default" : "secondary"}
                              >
                                {upcoming ? "Upcoming" : "Past"}
                              </Badge>
                            </div>
                            {meeting.description && (
                              <p className="text-muted-foreground">
                                {meeting.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {date}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {time}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {meeting.duration} minutes
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {meeting.meetingUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(meeting.meetingUrl, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Join
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Meetings Scheduled
                </h3>
                <p className="text-muted-foreground">
                  No virtual meetings have been scheduled for this course yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default withDashboardLayout(VirtualMeetings);
