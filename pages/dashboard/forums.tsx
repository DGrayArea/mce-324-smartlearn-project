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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  MessageSquare,
  Plus,
  Search,
  Users,
  BookOpen,
  Building,
  Globe,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    code: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  school?: {
    id: string;
    name: string;
    code: string;
  };
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  _count: {
    threads: number;
  };
}

const Forums = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scope: "global",
    courseId: "",
    departmentId: "",
    schoolId: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/forums/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch forum categories",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch forum categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        isGlobal: formData.scope === "global",
      };

      if (formData.scope === "course" && formData.courseId) {
        payload.courseId = formData.courseId;
      } else if (formData.scope === "department" && formData.departmentId) {
        payload.departmentId = formData.departmentId;
      } else if (formData.scope === "school" && formData.schoolId) {
        payload.schoolId = formData.schoolId;
      }

      const response = await fetch("/api/forums/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Forum category created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          scope: "global",
          courseId: "",
          departmentId: "",
          schoolId: "",
        });
        fetchCategories();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create category",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const response = await fetch("/api/forums/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: editingCategory.id,
          name: formData.name,
          description: formData.description,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Forum category updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        setFormData({
          name: "",
          description: "",
          scope: "global",
          courseId: "",
          departmentId: "",
          schoolId: "",
        });
        fetchCategories();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update category",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(
        `/api/forums/categories?categoryId=${categoryId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Forum category deleted successfully",
        });
        fetchCategories();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete category",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: ForumCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      scope: category.isGlobal ? "global" : "course",
      courseId: "",
      departmentId: "",
      schoolId: "",
    });
    setIsEditDialogOpen(true);
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateCategory = user?.role && !["STUDENT"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Discussion Forums
          </h2>
          <p className="text-muted-foreground">
            Participate in course discussions and ask questions
          </p>
        </div>
        {canCreateCategory && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Forum Category</DialogTitle>
                <DialogDescription>
                  Create a new discussion category for your course or department
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="scope">Scope</Label>
                  <Select
                    value={formData.scope}
                    onValueChange={(value) =>
                      setFormData({ ...formData, scope: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="course">Course Specific</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="school">School</SelectItem>
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
                  <Button type="submit">Create Category</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card
              key={category.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    {category.isGlobal && (
                      <Badge variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        Global
                      </Badge>
                    )}
                    {category.course && (
                      <Badge variant="outline">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Course
                      </Badge>
                    )}
                    {category.department && (
                      <Badge variant="outline">
                        <Building className="h-3 w-3 mr-1" />
                        Department
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {category._count.threads} threads
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created by {category.createdBy.name}
                  </div>
                  {category.course && (
                    <div className="text-sm text-muted-foreground">
                      Course: {category.course.code} - {category.course.title}
                    </div>
                  )}
                  {category.department && (
                    <div className="text-sm text-muted-foreground">
                      Department: {category.department.name}
                    </div>
                  )}
                  {category.school && (
                    <div className="text-sm text-muted-foreground">
                      School: {category.school.name}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to category threads
                      window.location.href = `/dashboard/forums/${category.id}`;
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Threads
                  </Button>
                  {canCreateCategory && (
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredCategories.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Forum Categories</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "No categories match your search criteria."
                : "No forum categories have been created yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Forum Category</DialogTitle>
            <DialogDescription>
              Update the category information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withDashboardLayout(Forums);
