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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  User,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
}

const FAQManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    order: 0,
    isPublished: true,
    tags: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    "General",
    "Academic",
    "Registration",
    "Grades",
    "Technical",
    "Account",
    "Courses",
    "Exams",
    "Library",
    "Financial",
  ];

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (statusFilter !== "ALL")
        params.append(
          "published",
          statusFilter === "PUBLISHED" ? "true" : "false"
        );

      const response = await fetch(`/api/admin/faqs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
      } else {
        throw new Error("Failed to fetch FAQs");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load FAQs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFAQ = async () => {
    if (
      !formData.question.trim() ||
      !formData.answer.trim() ||
      !formData.category
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/faqs", {
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
          description: data.message,
        });
        setCreateDialogOpen(false);
        resetForm();
        fetchFAQs();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create FAQ");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create FAQ",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFAQ = async () => {
    if (
      !selectedFAQ ||
      !formData.question.trim() ||
      !formData.answer.trim() ||
      !formData.category
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/faqs?id=${selectedFAQ.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        setEditDialogOpen(false);
        resetForm();
        fetchFAQs();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update FAQ");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFAQ = async () => {
    if (!selectedFAQ) return;

    try {
      const response = await fetch(`/api/admin/faqs?id=${selectedFAQ.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        setDeleteDialogOpen(false);
        setSelectedFAQ(null);
        fetchFAQs();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete FAQ");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      order: 0,
      isPublished: true,
      tags: [],
    });
    setSelectedFAQ(null);
  };

  const openEditDialog = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isPublished: faq.isPublished,
      tags: faq.tags,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setDeleteDialogOpen(true);
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading FAQs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">FAQ Management</h2>
          <p className="text-muted-foreground">
            Manage frequently asked questions and answers
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New FAQ</DialogTitle>
              <DialogDescription>
                Add a new frequently asked question and answer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <Label htmlFor="answer">Answer *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  placeholder="Enter the answer..."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Display order"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                />
                <Label htmlFor="isPublished">Published</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFAQ} disabled={submitting}>
                {submitting ? "Creating..." : "Create FAQ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchFAQs}>
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs Table */}
      <Card>
        <CardHeader>
          <CardTitle>FAQs ({filteredFAQs.length})</CardTitle>
          <CardDescription>
            Manage your frequently asked questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ||
                categoryFilter !== "ALL" ||
                statusFilter !== "ALL"
                  ? "No FAQs match your current filters."
                  : "Get started by creating your first FAQ."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFAQs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell className="max-w-md">
                        <div>
                          <p className="font-medium truncate">{faq.question}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {faq.answer}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{faq.category}</Badge>
                      </TableCell>
                      <TableCell>{faq.order}</TableCell>
                      <TableCell>
                        <Badge
                          variant={faq.isPublished ? "default" : "secondary"}
                        >
                          {faq.isPublished ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(faq.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {faq.createdBy.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(faq)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(faq)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the frequently asked question and answer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-question">Question *</Label>
              <Input
                id="edit-question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="Enter the question..."
              />
            </div>
            <div>
              <Label htmlFor="edit-answer">Answer *</Label>
              <Textarea
                id="edit-answer"
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="Enter the answer..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-order">Order</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Display order"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
              />
              <Label htmlFor="edit-isPublished">Published</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFAQ} disabled={submitting}>
              {submitting ? "Updating..." : "Update FAQ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be
              undone.
              <br />
              <br />
              <strong>Question:</strong> {selectedFAQ?.question}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFAQ}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete FAQ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withDashboardLayout(FAQManagement);
