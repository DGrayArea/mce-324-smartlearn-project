import React, { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Link,
  Plus,
  Edit,
  Trash2,
  Copy,
  Filter,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";
// Removed dummy data imports; this page will use API-backed data

interface MeetingWithCourse {
  id: string;
  title: string;
  course: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  status: string;
  attendees?: number;
  maxAttendees?: number;
  link?: string;
  description?: string;
  createdBy?: string;
  participants: string[];
  courseDetails?: { code: string; name: string } | null;
}

const Meetings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<MeetingWithCourse[]>([]);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [isEditMeetingOpen, setIsEditMeetingOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingWithCourse | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    course: "",
    date: "",
    time: "",
    duration: "1h",
    type: "lecture" as "lecture" | "tutorial" | "exam" | "meeting",
    maxAttendees: 50,
    description: "",
    link: "",
  });

  const availableCourses: { code: string; name: string }[] = [];

  // Load meetings from API on component mount / role change
  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.role) return;
        const endpoint =
          user.role === "LECTURER"
            ? "/api/lecturer/meetings"
            : "/api/student/meetings?academicYear=2024/2025&semester=FIRST";
        const res = await fetch(endpoint);
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch meetings");
        const apiMeetings = (data.meetings || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          course: m.course?.code || m.courseCode || "",
          date: m.date || m.scheduledDate || "",
          time: m.time || m.scheduledTime || "",
          duration: m.duration || "1h",
          type: m.type || "meeting",
          status: m.status || "scheduled",
          attendees: m.attendees || 0,
          maxAttendees: m.maxAttendees || 50,
          link: m.link || m.joinLink || "",
          description: m.description || "",
          createdBy: m.createdBy?.name || m.createdBy || "",
          participants: m.participants?.map((p: any) => p.name) || [],
          courseDetails: m.course
            ? { code: m.course.code, name: m.course.title || m.course.name }
            : null,
        }));
        setMeetings(apiMeetings);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [user?.role]);

  // No localStorage usage; meetings come from API

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lecture":
        return Video;
      case "tutorial":
        return Users;
      case "exam":
        return Clock;
      default:
        return Calendar;
    }
  };

  const getFilteredMeetings = () => {
    const now = new Date();
    const currentTime = now.getTime();

    switch (activeTab) {
      case "upcoming":
        return meetings.filter((meeting) => {
          const meetingDateTime = new Date(
            `${meeting.date} ${meeting.time}`
          ).getTime();
          return (
            meetingDateTime > currentTime && meeting.status === "scheduled"
          );
        });
      case "ongoing":
        return meetings.filter((meeting) => meeting.status === "ongoing");
      case "past":
        return meetings.filter((meeting) => {
          const meetingDateTime = new Date(
            `${meeting.date} ${meeting.time}`
          ).getTime();
          return (
            meetingDateTime < currentTime || meeting.status === "completed"
          );
        });
      default:
        return meetings;
    }
  };

  const sendMeetingNotifications = () => {
    toast({ title: "Notifications", description: "Invitations sent" });
  };

  const handleCreateMeeting = () => {
    if (
      newMeeting.title &&
      newMeeting.course &&
      newMeeting.date &&
      newMeeting.time
    ) {
      const meeting: MeetingWithCourse = {
        id: Date.now().toString(),
        title: newMeeting.title,
        course: newMeeting.course,
        date: newMeeting.date,
        time: newMeeting.time,
        duration: newMeeting.duration,
        type: newMeeting.type,
        status: "scheduled",
        attendees: 0,
        maxAttendees: newMeeting.maxAttendees,
        link:
          newMeeting.link ||
          `https://zoom.us/j/${Math.random().toString(36).substr(2, 9)}`,
        description: newMeeting.description,
        createdBy: user ? user.name : "Current User",
        participants: [],
        courseDetails: availableCourses.find(
          (course) => course.code === newMeeting.course
        ),
      };

      setMeetings((prev) => [meeting, ...prev]);
      setNewMeeting({
        title: "",
        course: "",
        date: "",
        time: "",
        duration: "1h",
        type: "lecture",
        maxAttendees: 50,
        description: "",
        link: "",
      });
      setIsCreateMeetingOpen(false);

      // Send notifications (placeholder)
      sendMeetingNotifications();

      toast({
        title: "Meeting Created",
        description: `Meeting "${meeting.title}" has been scheduled successfully`,
      });
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
    }
  };

  const handleJoinMeeting = (meeting: MeetingWithCourse) => {
    if (meeting.participants.includes(user ? user.name : "Current User")) {
      toast({
        title: "Already Joined",
        description: "You are already a participant in this meeting.",
      });
      return;
    }

    const updatedMeeting = {
      ...meeting,
      attendees: (meeting.attendees || 0) + 1,
      participants: [
        ...meeting.participants,
        user ? user.name : "Current User",
      ],
    };

    setMeetings((prev) =>
      prev.map((m) => (m.id === meeting.id ? updatedMeeting : m))
    );

    toast({
      title: "Joined Meeting",
      description: `You have successfully joined "${meeting.title}"`,
    });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Meeting link has been copied to clipboard",
    });
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    toast({
      title: "Meeting Deleted",
      description: "Meeting has been deleted successfully",
    });
  };

  const handleEditMeeting = (meeting: MeetingWithCourse) => {
    setSelectedMeeting(meeting);
    setNewMeeting({
      title: meeting.title,
      course: meeting.course,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      type: meeting.type,
      maxAttendees: meeting.maxAttendees || 50,
      description: meeting.description || "",
      link: meeting.link || "",
    });
    setIsEditMeetingOpen(true);
  };

  const handleUpdateMeeting = () => {
    if (
      selectedMeeting &&
      newMeeting.title &&
      newMeeting.course &&
      newMeeting.date &&
      newMeeting.time
    ) {
      const updatedMeeting = {
        ...selectedMeeting,
        title: newMeeting.title,
        course: newMeeting.course,
        date: newMeeting.date,
        time: newMeeting.time,
        duration: newMeeting.duration,
        type: newMeeting.type,
        maxAttendees: newMeeting.maxAttendees,
        description: newMeeting.description,
        link: newMeeting.link,
        courseDetails: availableCourses.find(
          (course) => course.code === newMeeting.course
        ),
      };

      setMeetings((prev) =>
        prev.map((m) => (m.id === selectedMeeting.id ? updatedMeeting : m))
      );
      setIsEditMeetingOpen(false);
      setSelectedMeeting(null);

      toast({
        title: "Meeting Updated",
        description: `Meeting "${updatedMeeting.title}" has been updated successfully`,
      });
    }
  };

  const isParticipant = (meeting: MeetingWithCourse) => {
    return meeting.participants.includes(user ? user.name : "Current User");
  };

  const canManageMeeting = (meeting: MeetingWithCourse) => {
    return user?.role === "LECTURER" && meeting.createdBy === user.name;
  };

  const filteredMeetings = getFilteredMeetings();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Virtual Meetings
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "LECTURER"
              ? "Schedule and manage your virtual classes and meetings."
              : "Join your scheduled lectures and meetings."}
          </p>
        </div>
        {user?.role === "LECTURER" && (
          <Dialog
            open={isCreateMeetingOpen}
            onOpenChange={setIsCreateMeetingOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule New Meeting</DialogTitle>
                <DialogDescription>
                  Create a new virtual meeting or lecture session
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter meeting title"
                    value={newMeeting.title}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select
                    value={newMeeting.course}
                    onValueChange={(value) =>
                      setNewMeeting((prev) => ({ ...prev, course: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
                        <SelectItem key={course.code} value={course.code}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) =>
                        setNewMeeting((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) =>
                        setNewMeeting((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={newMeeting.duration}
                      onValueChange={(value) =>
                        setNewMeeting((prev) => ({ ...prev, duration: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30m">30 minutes</SelectItem>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="1.5h">1.5 hours</SelectItem>
                        <SelectItem value="2h">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newMeeting.type}
                      onValueChange={(value) =>
                        setNewMeeting((prev) => ({
                          ...prev,
                          type: value as Meeting["type"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Max Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    placeholder="50"
                    value={newMeeting.maxAttendees}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        maxAttendees: parseInt(e.target.value) || 50,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Meeting description"
                    value={newMeeting.description}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Meeting Link (optional)</Label>
                  <Input
                    id="link"
                    placeholder="https://zoom.us/j/..."
                    value={newMeeting.link}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        link: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateMeetingOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMeeting}>Create Meeting</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Meeting Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="flex items-center space-x-2">
            <Video className="h-4 w-4" />
            <span>Ongoing</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Past</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map((meeting) => {
              const TypeIcon = getTypeIcon(meeting.type);
              const isJoined = isParticipant(meeting);
              const canManage = canManageMeeting(meeting);

              return (
                <Card key={meeting.id} className="overflow-hidden">
                  <CardHeader className="border-b p-4">
                    <div className="flex justify-between items-start">
                      <Badge variant={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <TypeIcon className="h-4 w-4 mr-1" />
                        <span className="capitalize">{meeting.type}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <CardDescription>
                      {meeting.courseDetails
                        ? `${meeting.course} - ${meeting.courseDetails.name}`
                        : meeting.course}
                    </CardDescription>
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {meeting.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {format(new Date(meeting.date), "EEEE, MMM dd, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {meeting.time} ({meeting.duration})
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      <span>
                        {meeting.attendees || 0}/{meeting.maxAttendees}{" "}
                        attendees
                      </span>
                    </div>

                    {meeting.link && (
                      <div className="flex items-center text-sm text-primary">
                        <Link className="h-4 w-4 mr-2" />
                        <span className="truncate flex-1">
                          Meeting Link Available
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(meeting.link!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Created by: {meeting.createdBy}
                    </div>
                  </CardContent>

                  <div className="border-t p-4 flex justify-between">
                    {meeting.status === "scheduled" && meeting.link ? (
                      <div className="flex space-x-2 w-full">
                        {!isJoined && user?.role === "STUDENT" && (
                          <Button
                            className="flex-1"
                            onClick={() => handleJoinMeeting(meeting)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Join Meeting
                          </Button>
                        )}
                        {isJoined && (
                          <Button className="flex-1">
                            <Video className="h-4 w-4 mr-2" />
                            Enter Meeting
                          </Button>
                        )}
                        {canManage && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMeeting(meeting)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMeeting(meeting.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {canManage && (
                          <Button
                            size="sm"
                            onClick={() => handleEditMeeting(meeting)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Meeting Dialog */}
      <Dialog open={isEditMeetingOpen} onOpenChange={setIsEditMeetingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update meeting details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Meeting Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter meeting title"
                value={newMeeting.title}
                onChange={(e) =>
                  setNewMeeting((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course">Course</Label>
              <Select
                value={newMeeting.course}
                onValueChange={(value) =>
                  setNewMeeting((prev) => ({ ...prev, course: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((course) => (
                    <SelectItem key={course.code} value={course.code}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) =>
                    setNewMeeting((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={newMeeting.time}
                  onChange={(e) =>
                    setNewMeeting((prev) => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Select
                  value={newMeeting.duration}
                  onValueChange={(value) =>
                    setNewMeeting((prev) => ({ ...prev, duration: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30m">30 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="1.5h">1.5 hours</SelectItem>
                    <SelectItem value="2h">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={newMeeting.type}
                  onValueChange={(value) =>
                    setNewMeeting((prev) => ({
                      ...prev,
                      type: value as Meeting["type"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxAttendees">Max Attendees</Label>
              <Input
                id="edit-maxAttendees"
                type="number"
                placeholder="50"
                value={newMeeting.maxAttendees}
                onChange={(e) =>
                  setNewMeeting((prev) => ({
                    ...prev,
                    maxAttendees: parseInt(e.target.value) || 50,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Meeting description"
                value={newMeeting.description}
                onChange={(e) =>
                  setNewMeeting((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Meeting Link</Label>
              <Input
                id="edit-link"
                placeholder="https://zoom.us/j/..."
                value={newMeeting.link}
                onChange={(e) =>
                  setNewMeeting((prev) => ({ ...prev, link: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditMeetingOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateMeeting}>Update Meeting</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withDashboardLayout(Meetings);
