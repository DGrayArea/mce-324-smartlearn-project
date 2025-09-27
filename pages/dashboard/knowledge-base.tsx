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
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Star,
  Filter,
  Calendar,
  User,
  Tag,
} from "lucide-react";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  status: string;
  tags: string[];
  viewCount: number;
  helpful: number;
  notHelpful: number;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  relatedArticles?: {
    related: {
      id: string;
      title: string;
      summary?: string;
      category: string;
    };
  }[];
  _count?: {
    relatedArticles: number;
  };
}

const KnowledgeBase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedArticle, setSelectedArticle] =
    useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFeatured, setShowFeatured] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    category: "",
    tags: "",
    isFeatured: false,
    order: 0,
    status: "DRAFT",
  });

  const categories = [
    { value: "GETTING_STARTED", label: "Getting Started" },
    { value: "ACCOUNT_MANAGEMENT", label: "Account Management" },
    { value: "COURSE_REGISTRATION", label: "Course Registration" },
    { value: "GRADES_AND_RESULTS", label: "Grades & Results" },
    { value: "TECHNICAL_SUPPORT", label: "Technical Support" },
    { value: "ACADEMIC_POLICIES", label: "Academic Policies" },
    { value: "SYSTEM_GUIDES", label: "System Guides" },
    { value: "TROUBLESHOOTING", label: "Troubleshooting" },
    { value: "OTHER", label: "Other" },
  ];

  const statuses = [
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "all")
        params.append("status", selectedStatus);
      if (showFeatured) params.append("featured", "true");
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/knowledge/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch knowledge articles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, showFeatured, searchTerm, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const fetchArticle = async (articleId: string) => {
    try {
      const response = await fetch(
        `/api/knowledge/articles?articleId=${articleId}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.article;
      }
    } catch (error) {
      console.error("Error fetching article:", error);
    }
    return null;
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/knowledge/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Knowledge article created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          title: "",
          content: "",
          summary: "",
          category: "",
          tags: "",
          isFeatured: false,
          order: 0,
          status: "DRAFT",
        });
        fetchArticles();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create knowledge article",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating article:", error);
      toast({
        title: "Error",
        description: "Failed to create knowledge article",
        variant: "destructive",
      });
    }
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) return;

    try {
      const response = await fetch(
        `/api/knowledge/articles?articleId=${selectedArticle.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            tags: formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Knowledge article updated successfully",
        });
        setIsEditDialogOpen(false);
        fetchArticles();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update knowledge article",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating article:", error);
      toast({
        title: "Error",
        description: "Failed to update knowledge article",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this knowledge article?"))
      return;

    try {
      const response = await fetch(
        `/api/knowledge/articles?articleId=${articleId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Knowledge article deleted successfully",
        });
        fetchArticles();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete knowledge article",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge article",
        variant: "destructive",
      });
    }
  };

  const handleViewArticle = async (article: KnowledgeArticle) => {
    const fullArticle = await fetchArticle(article.id);
    if (fullArticle) {
      setSelectedArticle(fullArticle);
      setIsViewDialogOpen(true);
    }
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      summary: article.summary || "",
      category: article.category,
      tags: article.tags.join(", "),
      isFeatured: article.isFeatured,
      order: article.order,
      status: article.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleFeedback = async (articleId: string, helpful: boolean) => {
    try {
      const response = await fetch("/api/knowledge/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          helpful,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feedback recorded successfully",
        });
        // Refresh the article data
        const updatedArticle = await fetchArticle(articleId);
        if (updatedArticle) {
          setSelectedArticle(updatedArticle);
        }
        fetchArticles();
      } else {
        toast({
          title: "Error",
          description: "Failed to record feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error recording feedback:", error);
      toast({
        title: "Error",
        description: "Failed to record feedback",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canManageArticles =
    user?.role &&
    ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role);

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Search and browse help articles and documentation
          </p>
        </div>
        {canManageArticles && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Knowledge Article</DialogTitle>
                <DialogDescription>
                  Create a new help article for the knowledge base
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Article title"
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
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    placeholder="Brief summary of the article"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Article content (supports markdown)"
                    rows={8}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="tag1, tag2, tag3"
                    />
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
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isFeatured: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="isFeatured">Featured Article</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Article</Button>
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
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManageArticles && (
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant={showFeatured ? "default" : "outline"}
          onClick={() => setShowFeatured(!showFeatured)}
        >
          <Star className="mr-2 h-4 w-4" />
          Featured
        </Button>
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
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      {article.isFeatured && (
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <Badge className={getStatusColor(article.status)}>
                        {article.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {article.summary || "No summary available"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewArticle(article)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canManageArticles && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditArticle(article)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteArticle(article.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {article.author.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(article.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {article.viewCount} views
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {article.helpful}
                    </div>
                    <div className="flex items-center">
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {article.notHelpful}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {getCategoryLabel(article.category)}
                    </Badge>
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredArticles.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "No articles match your search criteria."
                : "No knowledge articles have been created yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Article Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
            <DialogDescription>{selectedArticle?.summary}</DialogDescription>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {selectedArticle.author.name}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(selectedArticle.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {selectedArticle.viewCount} views
                </div>
                <Badge variant="outline">
                  {getCategoryLabel(selectedArticle.category)}
                </Badge>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">
                  {selectedArticle.content}
                </div>
              </div>

              {selectedArticle.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm font-medium">Tags:</span>
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {selectedArticle.relatedArticles &&
                selectedArticle.relatedArticles.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">
                      Related Articles
                    </h4>
                    <div className="space-y-2">
                      {selectedArticle.relatedArticles.map((relation) => (
                        <Card key={relation.related.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">
                                {relation.related.title}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {relation.related.summary}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {getCategoryLabel(relation.related.category)}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, true)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful ({selectedArticle.helpful})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, false)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Not Helpful ({selectedArticle.notHelpful})
                  </Button>
                </div>
                {canManageArticles && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditArticle(selectedArticle);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Article
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Article</DialogTitle>
            <DialogDescription>Update the knowledge article</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateArticle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Article title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
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
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea
                id="edit-summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Brief summary of the article"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Article content (supports markdown)"
                rows={8}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="tag1, tag2, tag3"
                />
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
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isFeatured"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
              />
              <Label htmlFor="edit-isFeatured">Featured Article</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Article</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withDashboardLayout(KnowledgeBase);
