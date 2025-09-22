import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Video,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  lecturerName: string;
  startTime: Date;
  endTime: Date;
  meetingLink: string;
  meetingId: string;
  meetingPassword?: string;
  status: "UPCOMING" | "LIVE" | "ENDED";
  isRecurring: boolean;
  meetingType: "LECTURE" | "TUTORIAL" | "OFFICE_HOURS" | "EXAM";
}

const StudentMeetings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("FIRST");
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      fetchMeetings();
    }
  }, [user, academicYear, semester]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        academicYear,
        semester,
      });

      const response = await fetch(`/api/student/meetings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      } else {
        throw new Error("Failed to fetch meetings");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = (meeting: Meeting) => {
    if (meeting.status === "ENDED") {
      toast({
        title: "Meeting Ended",
        description: "This meeting has already ended.",
        variant: "destructive",
      });
      return;
    }

    if (meeting.status === "UPCOMING") {
      const now = new Date();
      const startTime = new Date(meeting.startTime);
      const timeDiff = startTime.getTime() - now.getTime();

      if (timeDiff > 0) {
        toast({
          title: "Meeting Not Started",
          description: `This meeting starts at ${startTime.toLocaleString()}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Open meeting link in new tab
    window.open(meeting.meetingLink, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "LIVE":
        return "bg-green-100 text-green-800";
      case "ENDED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case "LECTURE":
        return "bg-purple-100 text-purple-800";
      case "TUTORIAL":
        return "bg-orange-100 text-orange-800";
      case "OFFICE_HOURS":
        return "bg-blue-100 text-blue-800";
      case "EXAM":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getTimeUntilMeeting = (startTime: Date) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) return "Started";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${minutes}m`;
    return `In ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">
          Loading meetings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
          <p className="text-muted-foreground">
            Join live lectures, tutorials, and office hours
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="academicYear">Academic Year:</label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="semester">Semester:</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">First</SelectItem>
                  <SelectItem value="SECOND">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Upcoming & Live Meetings
          </CardTitle>
          <CardDescription>
            Join live sessions and upcoming meetings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.filter((m) => m.status !== "ENDED").length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Upcoming Meetings
              </h3>
              <p className="text-muted-foreground">
                No meetings are scheduled for the selected period.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings
                .filter((m) => m.status !== "ENDED")
                .map((meeting) => (
                  <Card key={meeting.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge
                          className={getMeetingTypeColor(meeting.meetingType)}
                        >
                          {meeting.meetingType.replace("_", " ")}
                        </Badge>
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <CardDescription>
                        {meeting.courseCode} - {meeting.courseName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatTime(meeting.startTime)}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(meeting.startTime).toLocaleTimeString()} -{" "}
                          {new Date(meeting.endTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Lecturer: {meeting.lecturerName}</span>
                      </div>
                      {meeting.status === "UPCOMING" && (
                        <div className="text-sm font-medium text-blue-600">
                          {getTimeUntilMeeting(meeting.startTime)}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => joinMeeting(meeting)}
                        disabled={meeting.status === "ENDED"}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {meeting.status === "LIVE"
                          ? "Join Now"
                          : "Join Meeting"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Past Meetings
          </CardTitle>
          <CardDescription>
            View recordings and materials from past meetings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.filter((m) => m.status === "ENDED").length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Past Meetings</h3>
              <p className="text-muted-foreground">
                No meetings have been completed yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings
                    .filter((m) => m.status === "ENDED")
                    .map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium">
                          {meeting.title}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{meeting.courseCode}</p>
                            <p className="text-sm text-muted-foreground">
                              {meeting.courseName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getMeetingTypeColor(meeting.meetingType)}
                          >
                            {meeting.meetingType.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(meeting.startTime).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(meeting.startTime).toLocaleTimeString()}{" "}
                              - {new Date(meeting.endTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{meeting.lecturerName}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" disabled>
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Recording
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardLayout(StudentMeetings);
