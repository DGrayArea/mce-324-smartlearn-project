import React, { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessage, setChatMessage] = useState("");

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
        <p className="text-muted-foreground">
          Get help with your questions and technical issues.
        </p>
      </div>

      <Tabs defaultValue="help-center" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="help-center">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Center
          </TabsTrigger>
          <TabsTrigger value="faq">
            <BookOpen className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="chatbot">
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Metrics
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Get instant help with your questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/20">
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary rounded-lg p-3 max-w-xs">
                      <p className="text-sm">
                        Hello! I'm here to help you with any questions about the
                        platform. What can I assist you with today?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">My Support Tickets</h3>
              <p className="text-sm text-muted-foreground">
                Track your support requests
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </div>

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
                <Button>
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
    </div>
  );
};

export default withDashboardLayout(Support);
