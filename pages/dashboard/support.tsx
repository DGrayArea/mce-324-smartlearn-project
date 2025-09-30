import React, { useState, useCallback, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  MessageSquare,
  BookOpen,
  Bot,
  Ticket,
  Calendar,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Send,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  category: string;
  created: string;
  updated: string;
  assignedTo?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const supportTickets: SupportTicket[] = [
  {
    id: "T001",
    title: "Cannot access course materials",
    description: "I am unable to download the lecture slides for CS101.",
    status: "open",
    priority: "medium",
    category: "Technical",
    created: "2024-01-20 10:30",
    updated: "2024-01-20 10:30",
  },
  {
    id: "T002",
    title: "Grade calculation error",
    description: "My assignment grade seems to be calculated incorrectly.",
    status: "in-progress",
    priority: "high",
    category: "Academic",
    created: "2024-01-19 14:15",
    updated: "2024-01-20 09:00",
    assignedTo: "Support Team",
  },
];

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "How do I reset my password?",
    answer:
      'You can reset your password by clicking on "Forgot Password" on the login page. Enter your email address and follow the instructions sent to your email.',
    category: "Account",
  },
  {
    id: "2",
    question: "How do I submit assignments?",
    answer:
      'Navigate to the Assignments page, find your assignment, and click "Submit". You can upload files or enter text directly depending on the assignment type.',
    category: "Academic",
  },
  {
    id: "3",
    question: "How do I join virtual meetings?",
    answer:
      'Go to the Meetings page and click "Join Meeting" next to the scheduled meeting. Make sure you have a stable internet connection and proper audio/video setup.',
    category: "Technical",
  },
];

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "U";
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [issueType, setIssueType] = useState<string>("GENERAL");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "1",
      sender: "AI Assistant",
      content:
        "Hello! I'm here to help you with any questions about the platform. What can I assist you with today?",
      timestamp: new Date().toLocaleTimeString(),
      isBot: true,
    },
  ]);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "SUPPORT",
  });

  const embedChatUrl = process.env.NEXT_PUBLIC_CHAT_IFRAME_URL;
  const libreChatUrl = process.env.NEXT_PUBLIC_LIBRECHAT_URL;

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "default",
      "in-progress": "secondary",
      resolved: "outline",
      closed: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {priority}
      </Badge>
    );
  };

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendChatMessage = useCallback(async () => {
    const text = chatMessage.trim();
    if (!text) return;
    const displayName = user?.name || "You";

    const userMsg = {
      id: Date.now().toString(),
      sender: displayName,
      content: text,
      timestamp: new Date().toLocaleTimeString(),
      isBot: false,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatMessage("");

    try {
      const res = await fetch("/api/assistant/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, issueType }),
      });
      const data = await res.json();
      const reply =
        typeof data?.answer === "string"
          ? data.answer
          : "I couldn't find an answer. Please check the User Manual in Help Center.";
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "AI Assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString(),
        isBot: true,
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "AI Assistant",
        content:
          "There was a problem answering right now. Please try again or download the User Manual from Help Center.",
        timestamp: new Date().toLocaleTimeString(),
        isBot: true,
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }
  }, [chatMessage, user, issueType]);

  const handleCreateTicket = useCallback(() => {
    if (newTicket.title.trim() && newTicket.description.trim()) {
      setIsCreatingTicket(true);

      // Simulate ticket creation
      setTimeout(() => {
        toast({
          title: "Ticket Created",
          description: `Support ticket "${newTicket.title}" has been created successfully.`,
        });

        setNewTicket({
          title: "",
          description: "",
          category: "",
          priority: "medium",
        });
        setIsCreatingTicket(false);
      }, 1000);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description fields.",
        variant: "destructive",
      });
    }
  }, [newTicket, toast]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        toast({
          title: "File Uploaded",
          description: `${files.length} file(s) uploaded successfully (demo mode).`,
        });
      }
    },
    [toast]
  );

  const handleBookSession = useCallback(() => {
    toast({
      title: "Session Booking",
      description: "Support session booking initiated (demo mode).",
    });
  }, [toast]);

  const handleSubmitContact = async () => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Message sent", description: data.message });
        setIsContactOpen(false);
        setContactForm({
          name: "",
          email: "",
          subject: "",
          message: "",
          category: "SUPPORT",
        });
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
        <p className="text-muted-foreground">
          Get help with your questions and technical issues.
        </p>
      </div>

      <Tabs defaultValue="help-center" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 h-auto">
          <TabsTrigger
            value="help-center"
            className="flex-col sm:flex-row text-xs sm:text-sm p-2 sm:p-3"
          >
            <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Help Center</span>
            <span className="sm:hidden mt-1">Help</span>
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="flex-col sm:flex-row text-xs sm:text-sm p-2 sm:p-3"
          >
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">FAQ</span>
            <span className="sm:hidden mt-1">FAQ</span>
          </TabsTrigger>
          <TabsTrigger
            value="chatbot"
            className="flex-col sm:flex-row text-xs sm:text-sm p-2 sm:p-3"
          >
            <Bot className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">AI Assistant</span>
            <span className="sm:hidden mt-1">AI</span>
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="flex-col sm:flex-row text-xs sm:text-sm p-2 sm:p-3"
          >
            <Ticket className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Support Tickets</span>
            <span className="sm:hidden mt-1">Tickets</span>
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="flex-col sm:flex-row text-xs sm:text-sm p-2 sm:p-3"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Schedule</span>
            <span className="sm:hidden mt-1">Schedule</span>
          </TabsTrigger>
          <TabsTrigger
            value="metrics"
            className="flex-col sm:flex-row text-xs sm:text-sm p-2 sm:p-3"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Metrics</span>
            <span className="sm:hidden mt-1">Metrics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="help-center" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Learn the basics of using the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Setting up your profile</li>
                  <li>• Navigating the dashboard</li>
                  <li>• Understanding notifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Communication Tools</CardTitle>
                <CardDescription>
                  Master messaging and virtual meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Sending messages</li>
                  <li>• Joining virtual meetings</li>
                  <li>• Using discussion forums</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <Ticket className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Technical Support</CardTitle>
                <CardDescription>
                  Resolve technical issues quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Common troubleshooting</li>
                  <li>• Browser requirements</li>
                  <li>• System compatibility</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Manual download */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>User Manual</CardTitle>
                <CardDescription>
                  Download the full platform user manual (PDF)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={
                    "/" + encodeURIComponent("User Manual Second draft.pdf")
                  }
                  download
                >
                  <Button className="w-full">Download User Manual</Button>
                </a>
              </CardContent>
            </Card>

            {/* Contact Support visible only to admins */}
            {(user?.role === "DEPARTMENT_ADMIN" ||
              user?.role === "SCHOOL_ADMIN" ||
              user?.role === "SENATE_ADMIN") && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <MessageSquare className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>
                    Reach out directly to the support team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => setIsContactOpen(true)}
                  >
                    Open Contact Form
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="space-y-4">
            {filteredFAQs.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{item.question}</CardTitle>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-6">
          {embedChatUrl ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI Assistant (Embedded)
                </CardTitle>
                <CardDescription>
                  Embedded external chatbot for live demo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <iframe
                  src={embedChatUrl}
                  title="Embedded Chatbot"
                  className="w-full h-[600px] rounded-md border"
                />
              </CardContent>
            </Card>
          ) : libreChatUrl ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI Assistant (LibreChat)
                </CardTitle>
                <CardDescription>
                  Embedded LibreChat for live demo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <iframe
                  src={libreChatUrl}
                  title="LibreChat"
                  className="w-full h-[600px] rounded-md border"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Get instant help with your questions (demo)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Issue Type</Label>
                    <Select value={issueType} onValueChange={setIssueType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="ACCOUNT">Account</SelectItem>
                        <SelectItem value="COURSE_REG">
                          Course Registration
                        </SelectItem>
                        <SelectItem value="CONTENT_DOWNLOAD">
                          Content Download
                        </SelectItem>
                        <SelectItem value="VIRTUAL_MEETING">
                          Virtual Meeting
                        </SelectItem>
                        <SelectItem value="CHAT_QA">Chat & Q&A</SelectItem>
                        <SelectItem value="GRADES_RESULTS">
                          Grades & Results
                        </SelectItem>
                        <SelectItem value="NOTIFICATIONS">
                          Notifications
                        </SelectItem>
                        <SelectItem value="SUPPORT_TICKET">
                          Support Ticket
                        </SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/20">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {msg.isBot ? "AI" : userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 max-w-xs ${msg.isBot ? "bg-secondary" : "bg-primary text-primary-foreground"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {msg.sender}
                            </span>
                            <span className="text-xs opacity-70">
                              {msg.timestamp}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendChatMessage()
                    }
                  />
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={!chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold">My Support Tickets</h3>
              <p className="text-sm text-muted-foreground">
                Track your support requests
              </p>
            </div>
            <Button onClick={() => setIsCreatingTicket(!isCreatingTicket)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </div>

          {isCreatingTicket && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Support Ticket</CardTitle>
                <CardDescription>
                  Describe your issue and we&apos;ll help you resolve it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-title">Title</Label>
                    <Input
                      id="ticket-title"
                      placeholder="Brief description of your issue"
                      value={newTicket.title}
                      onChange={(e) =>
                        setNewTicket((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-category">Category</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) =>
                        setNewTicket((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-description">Description</Label>
                  <Textarea
                    id="ticket-description"
                    placeholder="Provide detailed information about your issue"
                    value={newTicket.description}
                    onChange={(e) =>
                      setNewTicket((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-priority">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) =>
                        setNewTicket((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Attach Files (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingTicket(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={
                      !newTicket.title.trim() || !newTicket.description.trim()
                    }
                  >
                    Create Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {supportTickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {ticket.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Ticket #{ticket.id} • Created {ticket.created}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {ticket.description}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Updated {ticket.updated}
                    </span>
                    {ticket.assignedTo && (
                      <span>Assigned to {ticket.assignedTo}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Schedule</CardTitle>
              <CardDescription>
                Book a session with our support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Schedule Support Session
                </h3>
                <p className="text-muted-foreground mb-4">
                  Book a one-on-one session with our support team
                </p>
                <Button onClick={handleBookSession}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Tickets
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Resolved Today
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  Average resolution time: 2.4h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  User Satisfaction
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2h</div>
                <p className="text-xs text-muted-foreground">
                  Average first response
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Support Dialog (Admins only) */}
      {(user?.role === "DEPARTMENT_ADMIN" ||
        user?.role === "SCHOOL_ADMIN" ||
        user?.role === "SENATE_ADMIN") && (
        <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Support</DialogTitle>
              <DialogDescription>
                Send a message to the platform support team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, subject: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  className="min-h-[120px]"
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, message: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContactOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitContact}>Send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default withDashboardLayout(Support);
