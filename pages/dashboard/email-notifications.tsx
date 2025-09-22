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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";

interface EmailNotification {
  id: string;
  type: string;
  subject: string;
  content: string;
  template?: string;
  data?: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

const EmailNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Email templates
  const emailTemplates: EmailTemplate[] = [
    {
      id: "grade_notification",
      name: "Grade Notification",
      subject: "Grade Update - {{courseName}}",
      content: `Dear {{studentName}},

Your grade for {{courseName}} has been updated.

Grade: {{grade}}
Score: {{score}}/{{totalScore}}
Comments: {{comments}}

Please log in to your dashboard to view detailed feedback.

Best regards,
{{lecturerName}}`,
      variables: ["studentName", "courseName", "grade", "score", "totalScore", "comments", "lecturerName"],
    },
    {
      id: "deadline_reminder",
      name: "Deadline Reminder",
      subject: "Assignment Deadline Reminder - {{assignmentName}}",
      content: `Dear {{studentName}},

This is a reminder that your assignment "{{assignmentName}}" is due on {{dueDate}}.

Course: {{courseName}}
Due Date: {{dueDate}}
Time Remaining: {{timeRemaining}}

Please ensure you submit your assignment on time.

Best regards,
{{lecturerName}}`,
      variables: ["studentName", "assignmentName", "dueDate", "courseName", "timeRemaining", "lecturerName"],
    },
    {
      id: "course_announcement",
      name: "Course Announcement",
      subject: "Course Announcement - {{courseName}}",
      content: `Dear Students,

{{announcement}}

Course: {{courseName}}
Posted by: {{lecturerName}}
Date: {{date}}

Please check your dashboard for more details.

Best regards,
{{lecturerName}}`,
      variables: ["announcement", "courseName", "lecturerName", "date"],
    },
  ];

  // Form state
  const [formData, setFormData] = useState({
    type: "",
    recipientId: "",
    recipientEmail: "",
    subject: "",
    content: "",
    template: "",
    data: {},
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(`/api/notifications/email?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch email notifications");
      }

      const data = await response.json();
      setNotifications(data.emailNotifications || []);
    } catch (error) {
      console.error("Error fetching email notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch email notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [statusFilter, typeFilter]);

  const handleSendEmail = async () => {
    try {
      setSending(true);
      
      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send email notification");
      }

      toast({
        title: "Success",
        description: "Email notification sent successfully",
      });

      setShowSendDialog(false);
      setFormData({
        type: "",
        recipientId: "",
        recipientEmail: "",
        subject: "",
        content: "",
        template: "",
        data: {},
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send email notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template: templateId,
        subject: template.subject,
        content: template.content,
        type: templateId,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "BOUNCED":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "DELIVERED":
        return "bg-blue-100 text-blue-800";
      case "BOUNCED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Notifications</h1>
            <p className="text-muted-foreground">
              Manage and send email notifications to users
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Notifications</h1>
          <p className="text-muted-foreground">
            Manage and send email notifications to users
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchNotifications} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Email Notification</DialogTitle>
                <DialogDescription>
                  Send an email notification to a user or group of users.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template">Email Template</Label>
                    <Select onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Notification Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g., grade_notification"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Email content"
                    rows={8}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSendDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSendEmail} disabled={sending}>
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? "Sending..." : "Send Email"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="BOUNCED">Bounced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="grade_notification">Grade Notification</SelectItem>
                <SelectItem value="deadline_reminder">Deadline Reminder</SelectItem>
                <SelectItem value="course_announcement">Course Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            {filteredNotifications.length} email notifications found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{notification.recipient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {notification.recipient.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {notification.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{notification.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(notification.status)}
                      <Badge className={getStatusColor(notification.status)}>
                        {notification.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(notification.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {notification.sentAt 
                      ? new Date(notification.sentAt).toLocaleString()
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {notification.status === "FAILED" && (
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Email Notifications</h3>
              <p className="text-muted-foreground">
                No email notifications found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardLayout(EmailNotifications);

