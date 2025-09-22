import React, { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Plus,
  Send,
  Phone,
  PhoneOff,
  Users,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Paperclip,
  Smile,
} from "lucide-react";

interface ChatSession {
  id: string;
  sessionId: string;
  status: string;
  priority: string;
  subject?: string;
  startedAt: string;
  endedAt?: string;
  lastMessageAt?: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  agent?: {
    id: string;
    name: string;
    role: string;
  };
  _count: {
    messages: number;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

const LiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    priority: "NORMAL",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isStudent = user?.role === "STUDENT";
  const isAdmin =
    user?.role &&
    ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (isAdmin) {
        params.append("status", "WAITING");
      }

      const response = await fetch(`/api/live-chat/sessions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch chat sessions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch chat sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/live-chat/messages?sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch messages",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.sessionId);
    }
  }, [selectedSession, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/live-chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Chat session created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          subject: "",
          priority: "NORMAL",
        });
        fetchSessions();
        setSelectedSession(data.session);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create chat session",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !newMessage.trim()) return;

    try {
      setMessageLoading(true);
      const response = await fetch("/api/live-chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedSession.sessionId,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        fetchSessions(); // Refresh sessions to update last message time
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setMessageLoading(false);
    }
  };

  const handleTakeSession = async (session: ChatSession) => {
    try {
      const response = await fetch(
        `/api/live-chat/sessions?sessionId=${session.sessionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId: user?.id,
            status: "ACTIVE",
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Chat session taken successfully",
        });
        fetchSessions();
        setSelectedSession(session);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to take chat session",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error taking session:", error);
      toast({
        title: "Error",
        description: "Failed to take chat session",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async (session: ChatSession) => {
    try {
      const response = await fetch(
        `/api/live-chat/sessions?sessionId=${session.sessionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "ENDED",
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Chat session ended successfully",
        });
        fetchSessions();
        if (selectedSession?.sessionId === session.sessionId) {
          setSelectedSession(null);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to end chat session",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end chat session",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "WAITING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "ACTIVE":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "ENDED":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "ENDED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "NORMAL":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] space-x-4">
      {/* Sessions List */}
      <div className="w-1/3 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Live Chat</h2>
          {isStudent && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat Session</DialogTitle>
                  <DialogDescription>
                    Begin a new live chat session with support
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Start Chat</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`cursor-pointer transition-colors ${
                  selectedSession?.id === session.id
                    ? "ring-2 ring-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {session.subject || "No subject"}
                        </h4>
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1">{session.status}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isStudent ? "Support Agent" : session.user.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge className={getPriorityColor(session.priority)}>
                        {session.priority}
                      </Badge>
                      {isAdmin && session.status === "WAITING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTakeSession(session);
                          }}
                        >
                          Take
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {session._count.messages} messages
                    </div>
                    <div>
                      {session.lastMessageAt
                        ? formatTime(session.lastMessageAt)
                        : formatTime(session.startedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {sessions.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Chat Sessions</h3>
              <p className="text-muted-foreground">
                {isStudent
                  ? "Start a new chat session to get help."
                  : "No chat sessions are currently available."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {selectedSession.subject || "Live Chat Session"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isStudent
                        ? `Agent: ${selectedSession.agent?.name || "Waiting for agent"}`
                        : `Student: ${selectedSession.user.name}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(selectedSession.status)}>
                      {getStatusIcon(selectedSession.status)}
                      <span className="ml-1">{selectedSession.status}</span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEndSession(selectedSession)}
                    >
                      <PhoneOff className="h-4 w-4 mr-1" />
                      End Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender.id === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender.id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.sender.name}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.fileUrl && (
                          <div className="mt-2">
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline"
                            >
                              📎 {message.fileName}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Message Input */}
              {selectedSession.status === "ACTIVE" && (
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <div className="flex-1">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={1}
                        className="resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || messageLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          </>
        ) : (
          <Card className="flex-1">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Chat Selected</h3>
                <p className="text-muted-foreground">
                  {isStudent
                    ? "Start a new chat session or select an existing one."
                    : "Select a chat session to view messages."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default withDashboardLayout(LiveChat);
