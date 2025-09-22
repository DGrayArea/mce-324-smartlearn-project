import React, { useState, useEffect, useCallback } from "react";
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
  Ticket,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  lastResponseAt?: string;
  student: {
    id: string;
    name: string;
    studentId: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
  _count: {
    responses: number;
  };
}

interface SupportResponse {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
}

const SupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [responses, setResponses] = useState<SupportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });
  const [responseData, setResponseData] = useState({
    content: "",
    isInternal: false,
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedPriority) params.append("priority", selectedPriority);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/support/tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch support tickets",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedPriority, selectedCategory, toast]);

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, selectedPriority, selectedCategory, fetchTickets]);

  const fetchResponses = async (ticketId: string) => {
    try {
      const response = await fetch(
        `/api/support/responses?ticketId=${ticketId}`
      );
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses);
      }
    } catch (error) {
      console.error("Error fetching responses:", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Support ticket created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "",
          priority: "MEDIUM",
        });
        fetchTickets();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create support ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive",
      });
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const response = await fetch("/api/support/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          content: responseData.content,
          isInternal: responseData.isInternal,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Response submitted successfully",
        });
        setIsResponseDialogOpen(false);
        setResponseData({
          content: "",
          isInternal: false,
        });
        fetchResponses(selectedTicket.id);
        fetchTickets(); // Refresh tickets to update status
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to submit response",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this support ticket?"))
      return;

    try {
      const response = await fetch(
        `/api/support/tickets?ticketId=${ticketId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Support ticket deleted successfully",
        });
        fetchTickets();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete support ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to delete support ticket",
        variant: "destructive",
      });
    }
  };

  const openViewDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
    fetchResponses(ticket.id);
  };

  const openResponseDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsResponseDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "CLOSED":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "LOW":
        return <Info className="h-4 w-4 text-green-600" />;
      case "MEDIUM":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "URGENT":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateTicket = user?.role === "STUDENT";
  const canRespondToTickets = user?.role && !["STUDENT"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Support Tickets</h2>
          <p className="text-muted-foreground">
            {canCreateTicket
              ? "Create and track your support requests"
              : "Manage and respond to support tickets"}
          </p>
        </div>
        {canCreateTicket && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Describe your issue and we&apos;ll help you resolve it
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNICAL">Technical Issue</SelectItem>
                      <SelectItem value="ACADEMIC">Academic Support</SelectItem>
                      <SelectItem value="ACCOUNT">Account Issue</SelectItem>
                      <SelectItem value="COURSE">Course Related</SelectItem>
                      <SelectItem value="GRADES">Grades & Results</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide detailed information about your issue..."
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
                  <Button type="submit">Create Ticket</Button>
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
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="TECHNICAL">Technical</SelectItem>
            <SelectItem value="ACADEMIC">Academic</SelectItem>
            <SelectItem value="ACCOUNT">Account</SelectItem>
            <SelectItem value="COURSE">Course</SelectItem>
            <SelectItem value="GRADES">Grades</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">
                          {ticket.status.replace("_", " ")}
                        </span>
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {getPriorityIcon(ticket.priority)}
                        <span className="ml-1">{ticket.priority}</span>
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {ticket.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewDialog(ticket)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canRespondToTickets && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResponseDialog(ticket)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                    {ticket.student.id === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTicket(ticket.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {ticket.student.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {ticket._count.responses} responses
                    </div>
                    {ticket.assignedTo && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Assigned to {ticket.assignedTo.name}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ticket.category}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTickets.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "No tickets match your search criteria."
                : canCreateTicket
                  ? "You haven't created any support tickets yet."
                  : "No support tickets have been created yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Support Ticket Details</DialogTitle>
            <DialogDescription>
              View ticket information and conversation history
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">
                    {selectedTicket.title}
                  </h3>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1">
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {getPriorityIcon(selectedTicket.priority)}
                    <span className="ml-1">{selectedTicket.priority}</span>
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {selectedTicket.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div>Created by: {selectedTicket.student.name}</div>
                  <div>Category: {selectedTicket.category}</div>
                  <div>
                    Created:{" "}
                    {new Date(selectedTicket.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold">Conversation History</h4>
                <div className="space-y-3">
                  {responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 rounded-lg ${
                        response.isInternal
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {response.author.name}
                          </span>
                          <Badge variant="outline">
                            {response.author.role}
                          </Badge>
                          {response.isInternal && (
                            <Badge variant="secondary">Internal</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{response.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {canRespondToTickets && (
                <div className="flex justify-end">
                  <Button onClick={() => openResponseDialog(selectedTicket)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Response
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog
        open={isResponseDialogOpen}
        onOpenChange={setIsResponseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Response</DialogTitle>
            <DialogDescription>Respond to the support ticket</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitResponse} className="space-y-4">
            <div>
              <Label htmlFor="response-content">Response</Label>
              <Textarea
                id="response-content"
                value={responseData.content}
                onChange={(e) =>
                  setResponseData({ ...responseData, content: e.target.value })
                }
                placeholder="Type your response here..."
                rows={4}
                required
              />
            </div>
            {canRespondToTickets && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isInternal"
                  checked={responseData.isInternal}
                  onChange={(e) =>
                    setResponseData({
                      ...responseData,
                      isInternal: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="isInternal">
                  Internal note (not visible to student)
                </Label>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResponseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Response</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withDashboardLayout(SupportTickets);
