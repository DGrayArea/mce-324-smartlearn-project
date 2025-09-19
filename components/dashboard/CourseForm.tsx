import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editCourse?: any;
  departments: any[];
  schools: any[];
  adminLevel: string;
}

const CourseForm: React.FC<CourseFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editCourse,
  departments,
  schools,
  adminLevel,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    creditUnit: "",
    description: "",
    type: "",
    level: "",
    semester: "",
    schoolId: "",
    departmentId: "",
  });

  useEffect(() => {
    if (editCourse) {
      setFormData({
        title: editCourse.title || "",
        code: editCourse.code || "",
        creditUnit: editCourse.creditUnit?.toString() || "",
        description: editCourse.description || "",
        type: editCourse.type || "",
        level: editCourse.level || "",
        semester: editCourse.semester || "",
        schoolId: editCourse.school?.id || "",
        departmentId: editCourse.department?.id || "",
      });
    } else {
      setFormData({
        title: "",
        code: "",
        creditUnit: "",
        description: "",
        type: "",
        level: "",
        semester: "",
        schoolId: "",
        departmentId: "",
      });
    }
  }, [editCourse, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editCourse ? "/api/admin/courses" : "/api/admin/courses";
      const method = editCourse ? "PUT" : "POST";
      
      const payload = editCourse 
        ? { courseId: editCourse.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save course");
      }

      toast({
        title: "Success",
        description: editCourse 
          ? "Course updated successfully!" 
          : "Course created successfully!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Course save error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editCourse ? "Edit Course" : "Create New Course"}
          </DialogTitle>
          <DialogDescription>
            {editCourse 
              ? "Update the course information below."
              : "Fill in the details to create a new course."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Introduction to Programming"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Course Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                placeholder="e.g., CEN101"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditUnit">Credit Units *</Label>
              <Input
                id="creditUnit"
                type="number"
                min="1"
                max="6"
                value={formData.creditUnit}
                onChange={(e) => handleInputChange("creditUnit", e.target.value)}
                placeholder="3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Student Level *</Label>
              <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEVEL_100">Level 100</SelectItem>
                  <SelectItem value="LEVEL_200">Level 200</SelectItem>
                  <SelectItem value="LEVEL_300">Level 300</SelectItem>
                  <SelectItem value="LEVEL_400">Level 400</SelectItem>
                  <SelectItem value="LEVEL_500">Level 500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select value={formData.semester} onValueChange={(value) => handleInputChange("semester", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">First Semester</SelectItem>
                  <SelectItem value="SECOND">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Course Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select course type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEPARTMENTAL">Departmental</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {adminLevel === "senate" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select value={formData.schoolId} onValueChange={(value) => handleInputChange("schoolId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.departmentId} onValueChange={(value) => handleInputChange("departmentId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name} ({department.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {adminLevel === "school" && (
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.departmentId} onValueChange={(value) => handleInputChange("departmentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name} ({department.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Course description and learning objectives..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editCourse ? "Updating..." : "Creating..."}
                </>
              ) : (
                editCourse ? "Update Course" : "Create Course"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseForm;
