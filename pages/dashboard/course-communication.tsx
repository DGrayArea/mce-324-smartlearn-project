import React, { useEffect, useState, useRef } from "react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import useSWR from "swr";
import { swrKeys, fetcher, useCourseCommunications } from "@/lib/swr";
import {
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Pin,
  CheckCircle,
  Send,
  Paperclip,
  Clock,
  BookOpen,
  Reply,
  MoreVertical,
  RefreshCw,
  Search,
  Check,
  CheckCheck,
  MessageCircle,
  Users,
  Lock,
  Unlock,
} from "lucide-react";

type Communication = {
  id: string;
  type: "CHAT_MESSAGE" | "QUESTION" | "ANSWER" | "ANNOUNCEMENT";
  title?: string;
  content: string;
  isPinned: boolean;
  isResolved: boolean;
  parentId?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  replies: Communication[];
  votes: Array<{ type: "UPVOTE" | "DOWNVOTE" }>;
  files: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
  _count: {
    votes: number;
    replies: number;
  };
};

type Course = {
  id: string;
  code: string;
  title: string;
  level: string;
  semester: "FIRST" | "SECOND";
  creditUnit: number;
};

const CourseCommunication = () => {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [activeTab, setActiveTab] = useState("chat");
  const [newMessage, setNewMessage] = useState("");
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "" });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const academicYear = "2024/2025";
  const semester = "FIRST";

  // Helper function for formatting time
  const formatTime = (dateString: string) => {
    if (!dateString) return "Just now";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Just now";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // SWR hooks
  const {
    data: coursesData,
    error: coursesError,
    isLoading: coursesLoading,
  } = useSWR(swrKeys.accessibleCourses(), fetcher);

  const {
    data: communications,
    error: communicationsError,
    isLoading: communicationsLoading,
    mutate: mutateCommunications,
    sendMessage: sendMessageOptimistic,
  } = useCourseCommunications(
    selectedCourse,
    activeTab === "chat" ? "CHAT_MESSAGE" : "QUESTION",
    academicYear,
    semester
  );

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Generate room cards from actual courses for current academic year and semester
  const rooms =
    coursesData?.courses
      ?.filter((course: Course) => course.semester === semester)
      ?.map((course: Course) => {
        // Get recent messages for this course to show last message
        const courseMessages = communications.filter(
          (comm) => comm.courseId === course.id
        );
        const lastMessage =
          courseMessages.length > 0 ? courseMessages[0] : null;

        // Count unread messages (messages from other users that are newer than the last time user was active)
        // For now, we'll count all messages from other users as unread if the course is not currently selected
        const unreadCount =
          selectedCourse === course.id
            ? 0
            : courseMessages.filter(
                (comm) =>
                  comm.user?.id !== user?.id && comm.type === "CHAT_MESSAGE"
              ).length;

        return {
          id: course.id,
          title: `${course.code} - ${course.title}`,
          course: `Mechatronics Engineering - ${course.level.replace("LEVEL_", "")}L`,
          status: "Open", // You can add logic to determine if course is active
          unreadCount: unreadCount,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: lastMessage
            ? formatTime(lastMessage.createdAt)
            : "No activity",
          lastMessageDate: lastMessage?.createdAt || null, // Add raw date for sorting
          level: course.level,
          semester: course.semester,
          creditUnits: course.creditUnit || 0,
        };
      }) || [];

  // Set first course as selected when courses load
  useEffect(() => {
    if (
      coursesData?.courses &&
      coursesData.courses.length > 0 &&
      !selectedCourse
    ) {
      setSelectedCourse(coursesData.courses[0].id);
    }
  }, [coursesData, selectedCourse]);

  // Auto-scroll when communications change
  useEffect(() => {
    scrollToBottom();
  }, [communications]);

  // Typing indicator functionality
  const handleTyping = (value: string) => {
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      // In a real app, you'd send typing status to server
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut for refresh (Ctrl/Cmd + R)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        refreshCommunications();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Manual refresh function for communications
  const refreshCommunications = async () => {
    if (isRefreshing || communicationsLoading) return; // Prevent multiple simultaneous refreshes

    setIsRefreshing(true);
    try {
      // Force a complete revalidation and data fetch
      await mutateCommunications(undefined, {
        revalidate: true,
        rollbackOnError: false,
      });

      // Show success feedback
      toast({
        title: "✅ Refreshed",
        description: "Messages updated successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh messages. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Filter and sort communications based on search query
  const filteredCommunications = communications
    .filter((comm) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        comm.content.toLowerCase().includes(query) ||
        comm.title?.toLowerCase().includes(query) ||
        getUserDisplayName(comm).toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Sort by pinned first, then by creation date
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Handle optimistic messages (temp IDs) - they should appear at the end for chat
      const aIsOptimistic = a.id?.startsWith("temp-");
      const bIsOptimistic = b.id?.startsWith("temp-");

      if (activeTab === "chat") {
        // For chat: optimistic messages at the end, then chronological order
        if (aIsOptimistic && !bIsOptimistic) return 1;
        if (!aIsOptimistic && bIsOptimistic) return -1;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        // For Q&A: optimistic messages at the top, then reverse chronological order
        if (aIsOptimistic && !bIsOptimistic) return -1;
        if (!aIsOptimistic && bIsOptimistic) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    });

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCourse) {
      toast({
        title: "Error",
        description: "Please select a course and enter a message",
        variant: "destructive",
      });
      return;
    }

    const messageToSend = newMessage.trim();
    setSendingMessage(true);

    try {
      console.log("Sending message with user data:", user);
      await sendMessageOptimistic({
        courseId: selectedCourse,
        type: "CHAT_MESSAGE",
        content: messageToSend,
        academicYear,
        semester,
        user,
      });

      setNewMessage("");
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const askQuestion = async () => {
    if (
      !newQuestion.title.trim() ||
      !newQuestion.content.trim() ||
      !selectedCourse
    ) {
      toast({
        title: "Error",
        description:
          "Please select a course and fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    setSendingQuestion(true);
    try {
      await sendMessageOptimistic({
        courseId: selectedCourse,
        type: "QUESTION",
        title: newQuestion.title.trim(),
        content: newQuestion.content.trim(),
        academicYear,
        semester,
        user,
      });

      setNewQuestion({ title: "", content: "" });
      toast({
        title: "Success",
        description: "Question posted successfully",
      });
    } catch (error: any) {
      console.error("Error asking question:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post question",
        variant: "destructive",
      });
    } finally {
      setSendingQuestion(false);
    }
  };

  const sendReply = async (parentId: string) => {
    if (!replyContent.trim() || !selectedCourse) return;

    setSendingReply(parentId);
    try {
      await sendMessageOptimistic({
        courseId: selectedCourse,
        type: "ANSWER",
        content: replyContent.trim(),
        parentId,
        academicYear,
        semester,
        user,
      });

      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Reply posted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    } finally {
      setSendingReply(null);
    }
  };

  const handleVote = async (
    communicationId: string,
    type: "UPVOTE" | "DOWNVOTE"
  ) => {
    try {
      const res = await fetch("/api/course/communications/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationId,
          type,
        }),
      });

      if (res.ok) {
        mutateCommunications();
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to vote",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = (comm: Communication) => {
    // Handle optimistic messages first - if it's a temp message, it's always from current user
    if (comm.id?.startsWith("temp-")) {
      return "You";
    }

    // If it's the current user, show "You"
    if (comm.user?.id === user?.id) {
      return "You";
    }

    // Handle undefined user
    if (!comm.user) {
      return "Unknown User";
    }

    if (comm.user.firstName && comm.user.lastName) {
      return `${comm.user.firstName} ${comm.user.lastName}`;
    }
    return comm.user.name || "Unknown User";
  };

  if (coursesLoading) {
    return <div className="p-6">Loading courses...</div>;
  }

  if (coursesError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Error loading courses
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {coursesError.message || "Failed to load courses"}
          </p>
        </div>
      </div>
    );
  }

  if (!coursesData?.courses || coursesData.courses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No courses available
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have access to any courses for communication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Course Communication</h1>
        <Badge variant="outline">
          {academicYear} • {semester}
        </Badge>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <label className="text-sm font-medium">Select Course:</label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Choose a course" />
          </SelectTrigger>
          <SelectContent>
            {coursesData?.courses?.map((course: Course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.code} - {course.title} (
                {course.level.replace("LEVEL_", "")}{" "}
                {course.semester === "FIRST" ? "1st" : "2nd"} Sem)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Room Cards Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Room Cards */}
        <div className="lg:col-span-1 flex flex-col h-[calc(100vh-200px)]">
          <div className="space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Course Chats</h3>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <div className="font-medium">
                {academicYear} • {semester === "FIRST" ? "1st" : "2nd"} Semester
              </div>
              <div>
                {rooms.length} active course{rooms.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4">
              {/* Group rooms by level */}
              {Object.entries(
                rooms.reduce((acc: Record<string, any[]>, room: any) => {
                  const level = room.level.replace("LEVEL_", "") + "L";
                  if (!acc[level]) acc[level] = [];
                  acc[level].push(room);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([level, levelRooms]: [string, any[]]) => {
                  // Sort rooms within each level by unread messages first, then by most recent activity
                  const sortedLevelRooms = levelRooms.sort((a, b) => {
                    // First priority: rooms with unread messages
                    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
                    if (a.unreadCount > 0 && b.unreadCount > 0) {
                      // If both have unread messages, sort by unread count (most unread first)
                      if (a.unreadCount !== b.unreadCount) {
                        return b.unreadCount - a.unreadCount;
                      }
                    }

                    // Second priority: most recent activity
                    if (a.lastMessageDate && b.lastMessageDate) {
                      return (
                        new Date(b.lastMessageDate).getTime() -
                        new Date(a.lastMessageDate).getTime()
                      );
                    }
                    // If only one has messages, prioritize it
                    if (a.lastMessageDate && !b.lastMessageDate) return -1;
                    if (!a.lastMessageDate && b.lastMessageDate) return 1;
                    // If neither has messages, sort by course code
                    return a.title.localeCompare(b.title);
                  });

                  return (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-gray-700">
                          {level}
                        </h4>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>

                      <div className="space-y-2">
                        {sortedLevelRooms.map((room: any) => (
                          <Card
                            key={room.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedCourse === room.id
                                ? "ring-2 ring-blue-500 bg-blue-50"
                                : room.unreadCount > 0
                                  ? "ring-1 ring-orange-300 bg-orange-50"
                                  : ""
                            }`}
                            onClick={() => setSelectedCourse(room.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <BookOpen className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-xs">
                                      {room.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                      {room.semester === "FIRST"
                                        ? "1st"
                                        : "2nd"}{" "}
                                      Sem • {room.creditUnits} CU
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Show activity indicator for rooms with recent messages */}
                                  {room.lastMessageDate && (
                                    <div
                                      className="w-2 h-2 bg-green-500 rounded-full"
                                      title="Recent activity"
                                    ></div>
                                  )}
                                  {room.status === "Open" ? (
                                    <Unlock className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Lock className="h-3 w-3 text-red-500" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="truncate flex-1 mr-2">
                                  {room.lastMessage}
                                </span>
                                <span>{room.lastMessageTime}</span>
                              </div>

                              {room.unreadCount > 0 && (
                                <div className="flex justify-end mt-2">
                                  <Badge
                                    variant="destructive"
                                    className="text-xs px-1 py-0"
                                  >
                                    {room.unreadCount}
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Main Chat Interface */}
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-200px)]">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Q&A
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="chat"
              className="flex-1 flex flex-col space-y-4"
            >
              {/* Chat Messages */}
              <Card className="flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Course Chat
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search messages..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 w-48 h-8 text-sm"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshCommunications}
                        disabled={communicationsLoading || isRefreshing}
                        className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <RefreshCw
                          className={`h-4 w-4 transition-transform ${
                            communicationsLoading || isRefreshing
                              ? "animate-spin text-blue-500"
                              : "text-gray-600"
                          }`}
                        />
                        <span className="text-sm">
                          {isRefreshing
                            ? "Refreshing..."
                            : communicationsLoading
                              ? "Loading..."
                              : "Refresh"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  {/* Messages List */}
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                      {filteredCommunications.map((comm) => {
                        const isOwnMessage = comm.user?.id === user?.id;
                        const isOptimistic = comm.id?.startsWith("temp-");
                        return (
                          <div
                            key={comm.id}
                            className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback
                                className={`text-sm ${
                                  isOwnMessage
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {getUserDisplayName(comm)
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`flex-1 max-w-[70%] ${isOwnMessage ? "flex flex-col items-end" : ""}`}
                            >
                              <div
                                className={`flex items-center gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                              >
                                <span className="font-medium text-sm">
                                  {getUserDisplayName(comm)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(comm.createdAt)}
                                </span>
                                {comm.isPinned && (
                                  <Pin className="h-3 w-3 text-amber-500" />
                                )}
                              </div>
                              <div
                                className={`mt-1 px-3 py-2 rounded-lg text-sm ${
                                  isOwnMessage
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="flex-1">{comm.content}</p>
                                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                    {isOptimistic ? (
                                      <div
                                        className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                                        title="Sending..."
                                      ></div>
                                    ) : isOwnMessage ? (
                                      <div className="flex items-center gap-1">
                                        {/* Read receipts for own messages */}
                                        <div className="flex items-center">
                                          <svg
                                            className="w-3 h-3 text-gray-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                          <svg
                                            className="w-3 h-3 text-gray-400 -ml-1"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                          Seen
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing Indicator */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span>
                            {typingUsers.length === 1
                              ? `${typingUsers[0]} is typing...`
                              : `${typingUsers.length} people are typing...`}
                          </span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Send Message */}
                  <div className="flex-shrink-0 p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping(e.target.value);
                          }}
                          placeholder="Type your message..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          className="pr-20"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-200"
                            onClick={() => {
                              // File attachment functionality
                              toast({
                                title: "File attachment",
                                description:
                                  "File attachment feature coming soon!",
                              });
                            }}
                          >
                            <Paperclip className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                      >
                        {sendingMessage ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>Send</span>
                            <Send className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </div>
                    {/* Keyboard shortcut hint */}
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                      <span>💡 Enter to send</span>
                      <span>⇧ Shift + Enter for new line</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qa" className="flex-1 flex flex-col space-y-4">
              {/* Search and Ask Question */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCommunications}
                  disabled={communicationsLoading || isRefreshing}
                  className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw
                    className={`h-4 w-4 transition-transform ${
                      communicationsLoading || isRefreshing
                        ? "animate-spin text-blue-500"
                        : "text-gray-600"
                    }`}
                  />
                  <span className="text-sm">
                    {isRefreshing
                      ? "Refreshing..."
                      : communicationsLoading
                        ? "Loading..."
                        : "Refresh"}
                  </span>
                </Button>
              </div>

              {/* Ask Question */}
              <Card className="flex-shrink-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Ask a Question
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={newQuestion.title}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, title: e.target.value })
                    }
                    placeholder="Question title..."
                  />
                  <Textarea
                    value={newQuestion.content}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        content: e.target.value,
                      })
                    }
                    placeholder="Describe your question in detail..."
                    rows={4}
                  />
                  <Button
                    onClick={askQuestion}
                    disabled={
                      !newQuestion.title.trim() ||
                      !newQuestion.content.trim() ||
                      sendingQuestion
                    }
                    className="w-full"
                  >
                    {sendingQuestion ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                        Posting...
                      </div>
                    ) : (
                      "Post Question"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Questions List */}
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-4">
                  {filteredCommunications.map((question) => (
                    <Card key={question.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Question Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {question.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  by {getUserDisplayName(question)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(question.createdAt)}
                                </span>
                                {question.user?.id === user?.id && (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-blue-100 text-blue-800"
                                  >
                                    Your Question
                                  </Badge>
                                )}
                                {question.isResolved && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleVote(question.id, "UPVOTE")
                                }
                              >
                                <ThumbsUp className="h-4 w-4" />
                                {question._count?.votes || 0}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleVote(question.id, "DOWNVOTE")
                                }
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Question Content */}
                          <p className="text-sm">{question.content}</p>

                          {/* Replies */}
                          {question.replies?.length > 0 && (
                            <div className="space-y-3 ml-4 border-l-2 border-blue-100 pl-4">
                              {question.replies?.map((reply) => {
                                const isOwnReply = reply.user?.id === user?.id;
                                const isOptimistic =
                                  reply.id?.startsWith("temp-");
                                return (
                                  <div key={reply.id} className="space-y-2">
                                    <div
                                      className={`flex items-center gap-3 ${isOwnReply ? "flex-row-reverse" : ""}`}
                                    >
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback
                                          className={`text-xs ${
                                            isOwnReply
                                              ? "bg-blue-100 text-blue-600"
                                              : "bg-green-100 text-green-600"
                                          }`}
                                        >
                                          {getUserDisplayName(reply)
                                            .charAt(0)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div
                                        className={`flex items-center gap-2 ${isOwnReply ? "flex-row-reverse" : ""}`}
                                      >
                                        <span className="text-sm font-medium">
                                          {getUserDisplayName(reply)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatTime(reply.createdAt)}
                                        </span>
                                        {isOwnReply && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs px-1 py-0"
                                          >
                                            You
                                          </Badge>
                                        )}
                                        {isOptimistic && (
                                          <div
                                            className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                                            title="Sending..."
                                          ></div>
                                        )}
                                      </div>
                                    </div>
                                    <div
                                      className={`${isOwnReply ? "ml-0 mr-9" : "ml-9 mr-0"} p-3 rounded-lg ${
                                        isOwnReply
                                          ? "bg-blue-50 border border-blue-200"
                                          : "bg-gray-50 border border-gray-200"
                                      }`}
                                    >
                                      <p className="text-sm text-gray-900">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Reply Input */}
                          {replyingTo === question.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                placeholder={
                                  question.user?.id === user?.id
                                    ? "Add a reply to continue the conversation... (Ctrl+Enter to send, Esc to cancel)"
                                    : "Write your answer... (Ctrl+Enter to send, Esc to cancel)"
                                }
                                rows={3}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    (e.ctrlKey || e.metaKey)
                                  ) {
                                    e.preventDefault();
                                    if (replyContent.trim() && !sendingReply) {
                                      sendReply(question.id);
                                    }
                                  } else if (e.key === "Escape") {
                                    setReplyingTo(null);
                                    setReplyContent("");
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => sendReply(question.id)}
                                  disabled={
                                    !replyContent.trim() ||
                                    sendingReply === question.id
                                  }
                                >
                                  {sendingReply === question.id ? (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      Posting...
                                    </div>
                                  ) : question.user?.id === user?.id ? (
                                    "Post Reply"
                                  ) : (
                                    "Post Answer"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent("");
                                  }}
                                  disabled={sendingReply === question.id}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Show "Reply" button for everyone (including question creator)
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReplyingTo(question.id)}
                            >
                              {question.user?.id === user?.id
                                ? "Add Reply"
                                : "Answer Question"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(CourseCommunication);
