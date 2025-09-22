import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Type for API response
interface ApiUser {
  id: string;
  name: string;
  email: string;
  role:
    | "STUDENT"
    | "LECTURER"
    | "DEPARTMENT_ADMIN"
    | "SCHOOL_ADMIN"
    | "SENATE_ADMIN";
  department: string;
  school?: string;
  level?: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin: string;
  originalUser?: any;
  avatar?: string;
  phone?: string;
  joinDate?: string;
  enrolledCourses?: string[];
  teachingCourses?: string[];
}
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";

// User interface for the frontend
interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "STUDENT"
    | "LECTURER"
    | "ADMIN"
    | "DEPARTMENT_ADMIN"
    | "SCHOOL_ADMIN"
    | "SENATE_ADMIN";
  department: string;
  school?: string;
  level?: string;
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  enrolledCourses?: string[];
  teachingCourses?: string[];
  phone?: string;
  address?: string;
  joinDate?: string;
}

// Helper function to check admin roles
const isAdmin = (role: string | undefined) => {
  if (!role) return false;
  const adminRoles = ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"];
  return adminRoles.includes(role);
};

interface School {
  id: string;
  name: string;
  code: string;
  departments: Department[];
}

interface Department {
  id: string;
  name: string;
  code: string;
  schoolId: string;
  school: {
    name: string;
    code: string;
  };
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Hierarchical navigation state
  const [currentView, setCurrentView] = useState<
    "schools" | "departments" | "users" | "user-types"
  >("schools");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Create user form states
  const [createUserForm, setCreateUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    departmentId: "",
    schoolId: "",
    level: "",
    matricNumber: "",
  });
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);
  const [availableSchools, setAvailableSchools] = useState<any[]>([]);

  // Seeding states
  const [seedingOpen, setSeedingOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedingData, setSeedingData] = useState<any>(null);

  // Fetch schools data (for Senate Admin)
  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  }, []);

  // Fetch departments data
  const fetchDepartments = useCallback(async (schoolId?: string) => {
    try {
      const url = schoolId
        ? `/api/admin/departments?schoolId=${schoolId}`
        : "/api/admin/departments";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  // Fetch users data
  const fetchUsers = useCallback(
    async (departmentId?: string) => {
      try {
        setLoading(true);
        const url = departmentId
          ? `/api/admin/users?departmentId=${departmentId}`
          : "/api/admin/users";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch users",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Fetch departments and schools for create user form
  const fetchDepartmentsAndSchools = useCallback(async () => {
    try {
      const [deptResponse, schoolResponse] = await Promise.all([
        fetch("/api/admin/departments"),
        fetch("/api/admin/schools"),
      ]);

      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setAvailableDepartments(deptData.departments || []);
      }

      if (schoolResponse.ok) {
        const schoolData = await schoolResponse.json();
        setAvailableSchools(schoolData.schools || []);
      }
    } catch (error) {
      console.error("Error fetching departments and schools:", error);
    }
  }, []);

  // Navigation functions
  const handleSchoolSelect = useCallback(
    (school: School) => {
      setSelectedSchool(school);
      setCurrentView("departments");
      fetchDepartments(school.id);
    },
    [fetchDepartments]
  );

  const handleDepartmentSelect = useCallback(
    (department: Department) => {
      setSelectedDept(department);
      setCurrentView("users");
      fetchUsers(department.id);
    },
    [fetchUsers]
  );

  const handleUserTypeSelect = useCallback(
    async (userType: string) => {
      setSelectedUserType(userType);
      setCurrentView("users");
      // Fetch all users first, then filter by type
      await fetchUsers();
      // The filtering will happen in the filteredUsers logic
    },
    [fetchUsers]
  );

  const handleBackToSchools = useCallback(() => {
    setCurrentView("schools");
    setSelectedSchool(null);
    setSelectedDept(null);
    setUsers([]);
  }, []);

  const handleBackToDepartments = useCallback(() => {
    setCurrentView("departments");
    setSelectedDept(null);
    setUsers([]);
  }, []);

  const handleBackToUserTypes = useCallback(() => {
    setCurrentView("user-types");
    setSelectedUserType(null);
    // Don't need to refetch, just clear the filter
  }, []);

  // Initialize based on user role
  useEffect(() => {
    if (currentUser?.role === "SENATE_ADMIN") {
      setCurrentView("schools");
      fetchSchools();
      fetchDepartmentsAndSchools(); // Only fetch for Senate Admin
    } else if (currentUser?.role === "SCHOOL_ADMIN") {
      setCurrentView("departments");
      fetchDepartments(); // Will fetch departments in their school
      fetchDepartmentsAndSchools(); // Only fetch for School Admin
    } else if (currentUser?.role === "DEPARTMENT_ADMIN") {
      setCurrentView("user-types");
      fetchUsers(); // Will fetch users in their department
      // Don't fetch schools/departments for Department Admin
    }
  }, [
    currentUser,
    fetchSchools,
    fetchDepartments,
    fetchDepartmentsAndSchools,
    fetchUsers,
  ]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      student: "outline",
      lecturer: "secondary",
      admin: "default",
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants]}>{role}</Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "suspended":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || user.status === selectedStatus;
    const matchesDepartment =
      selectedDepartment === "all" || user.department === selectedDepartment;

    // If a specific user type is selected, filter by that type
    const matchesUserType = !selectedUserType || user.role === selectedUserType;

    return (
      matchesSearch &&
      matchesRole &&
      matchesStatus &&
      matchesDepartment &&
      matchesUserType
    );
  });

  const userDepartments = Array.from(new Set(users.map((u) => u.department)));

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createUserForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }

      toast({
        title: "User Created",
        description: "New user has been added to the system.",
      });
      setIsCreateUserOpen(false);
      setCreateUserForm({
        name: "",
        email: "",
        password: "",
        role: "",
        departmentId: "",
        schoolId: "",
        level: "",
        matricNumber: "",
      });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    }
  };

  // Seeding functions
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/seed-organized", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Seeding failed");
      }

      setSeedingData(data.data);
      toast({
        title: "Database Seeded Successfully!",
        description:
          "Organized database has been populated with schools, departments, courses, and users",
      });
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error("Seeding error:", error);
      toast({
        title: "Seeding Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during seeding",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleEditUser = (userId: string) => {
    // TODO: Implement edit user dialog
    toast({
      title: "Edit User",
      description: `Edit functionality for user ${userId} - Coming soon!`,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/user-management?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      toast({
        title: "User Deleted",
        description: "User has been removed from the system.",
        variant: "destructive",
      });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? false : true;

    try {
      const response = await fetch(
        `/api/admin/user-management?userId=${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user status");
      }

      toast({
        title: "Status Updated",
        description: `User status changed to ${newStatus ? "active" : "inactive"}.`,
      });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // Render breadcrumb navigation
  const renderBreadcrumb = () => {
    const breadcrumbs = [];

    if (currentUser?.role === "SENATE_ADMIN") {
      breadcrumbs.push({ label: "Schools", active: currentView === "schools" });
      if (selectedSchool) {
        breadcrumbs.push({
          label: selectedSchool.name,
          active: currentView === "departments",
        });
      }
      if (selectedDept) {
        breadcrumbs.push({
          label: selectedDept.name,
          active: currentView === "users",
        });
      }
    } else if (currentUser?.role === "SCHOOL_ADMIN") {
      breadcrumbs.push({
        label: "Departments",
        active: currentView === "departments",
      });
      if (selectedDept) {
        breadcrumbs.push({
          label: selectedDept.name,
          active: currentView === "users",
        });
      }
    } else if (currentUser?.role === "DEPARTMENT_ADMIN") {
      if (currentView === "user-types") {
        breadcrumbs.push({ label: "User Types", active: true });
      } else if (currentView === "users") {
        breadcrumbs.push({ label: "User Types", active: false });
        if (selectedUserType) {
          const userTypeLabels = {
            STUDENT: "Students",
            LECTURER: "Lecturers",
            DEPARTMENT_ADMIN: "Department Admins",
          };
          breadcrumbs.push({
            label:
              userTypeLabels[selectedUserType as keyof typeof userTypeLabels] ||
              selectedUserType,
            active: true,
          });
        }
      }
    }

    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <span className={crumb.active ? "text-foreground font-medium" : ""}>
              {crumb.label}
            </span>
            {index < breadcrumbs.length - 1 && <span>/</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render schools view
  const renderSchoolsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {schools.map((school) => (
        <Card
          key={school.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleSchoolSelect(school)}
        >
          <CardHeader>
            <CardTitle className="text-lg">{school.name}</CardTitle>
            <CardDescription>{school.code}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {school.departments.length} departments
              </span>
              <Button variant="ghost" size="sm">
                View →
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render departments view
  const renderDepartmentsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((department) => (
        <Card
          key={department.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleDepartmentSelect(department)}
        >
          <CardHeader>
            <CardTitle className="text-lg">{department.name}</CardTitle>
            <CardDescription>{department.code}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {department.school.name}
              </span>
              <Button variant="ghost" size="sm">
                View →
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render user types view (for Department Admin)
  const renderUserTypesView = () => {
    const userTypeCounts = {
      STUDENT: users.filter((u) => u.role === "STUDENT").length,
      LECTURER: users.filter((u) => u.role === "LECTURER").length,
      DEPARTMENT_ADMIN: users.filter((u) => u.role === "DEPARTMENT_ADMIN")
        .length,
    };

    const userTypes = [
      {
        type: "STUDENT",
        label: "Students",
        count: userTypeCounts.STUDENT,
        icon: "👨‍🎓",
        description: "Students in your department",
      },
      {
        type: "LECTURER",
        label: "Lecturers",
        count: userTypeCounts.LECTURER,
        icon: "👨‍🏫",
        description: "Lecturers in your department",
      },
      {
        type: "DEPARTMENT_ADMIN",
        label: "Department Admins",
        count: userTypeCounts.DEPARTMENT_ADMIN,
        icon: "👨‍💼",
        description: "Department administrators",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userTypes.map((userType) => (
          <Card
            key={userType.type}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleUserTypeSelect(userType.type)}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">{userType.icon}</span>
                {userType.label}
              </CardTitle>
              <CardDescription>{userType.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {userType.count}
                </span>
                <Button variant="ghost" size="sm">
                  View →
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across the platform.
          </p>
          {renderBreadcrumb()}
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Full Name</Label>
                  <Input
                    id="user-name"
                    placeholder="Enter full name"
                    value={createUserForm.name}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="Enter email address"
                    value={createUserForm.email}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="Enter password"
                    value={createUserForm.password}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Select
                    value={createUserForm.role}
                    onValueChange={(value) =>
                      setCreateUserForm({ ...createUserForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="LECTURER">Lecturer</SelectItem>
                      <SelectItem value="DEPARTMENT_ADMIN">
                        Department Admin
                      </SelectItem>
                      <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                      <SelectItem value="SENATE_ADMIN">Senate Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createUserForm.role &&
                  (createUserForm.role === "STUDENT" ||
                    createUserForm.role === "LECTURER" ||
                    createUserForm.role === "department_admin") && (
                    <div className="space-y-2">
                      <Label htmlFor="user-department">Department</Label>
                      <Select
                        value={createUserForm.departmentId}
                        onValueChange={(value) =>
                          setCreateUserForm({
                            ...createUserForm,
                            departmentId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                {createUserForm.role === "school_admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="user-school">School</Label>
                    <Select
                      value={createUserForm.schoolId}
                      onValueChange={(value) =>
                        setCreateUserForm({
                          ...createUserForm,
                          schoolId: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSchools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {createUserForm.role === "STUDENT" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="user-level">Level</Label>
                      <Select
                        value={createUserForm.level}
                        onValueChange={(value) =>
                          setCreateUserForm({ ...createUserForm, level: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEVEL_100">100 Level</SelectItem>
                          <SelectItem value="LEVEL_200">200 Level</SelectItem>
                          <SelectItem value="LEVEL_300">300 Level</SelectItem>
                          <SelectItem value="LEVEL_400">400 Level</SelectItem>
                          <SelectItem value="LEVEL_500">500 Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-matric">
                        Matric Number (Optional)
                      </Label>
                      <Input
                        id="user-matric"
                        placeholder="Enter matric number"
                        value={createUserForm.matricNumber}
                        onChange={(e) =>
                          setCreateUserForm({
                            ...createUserForm,
                            matricNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateUserOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>Create User</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Database Seeding Dialog */}
        <Dialog open={seedingOpen} onOpenChange={setSeedingOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Seeding
              </DialogTitle>
              <DialogDescription>
                Populate the database with organized schools, departments,
                courses, lecturers, and students.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* What gets created */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Schools & Departments</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">SEET</Badge>
                      <span>Electrical & Technology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        SIPET
                      </Badge>
                      <span>Infrastructure & Processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">
                        SPS
                      </Badge>
                      <span>Physical Sciences</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800">
                        SLS
                      </Badge>
                      <span>Life Sciences</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Test Accounts</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Senate Admin:</span>
                      <br />
                      <span className="text-muted-foreground">
                        senate.admin@university.edu
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">MCE Admin:</span>
                      <br />
                      <span className="text-muted-foreground">
                        mce.admin@university.edu
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">MCE Student:</span>
                      <br />
                      <span className="text-muted-foreground">
                        mce.student1@university.edu
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Password: password123
                    </div>
                  </div>
                </div>
              </div>

              {/* Seeding results */}
              {seedingData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Seeding Complete!
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Schools:</span>{" "}
                      {seedingData.schools}
                    </div>
                    <div>
                      <span className="font-medium">Departments:</span>{" "}
                      {seedingData.departments}
                    </div>
                    <div>
                      <span className="font-medium">Lecturers:</span>{" "}
                      {seedingData.lecturers}
                    </div>
                    <div>
                      <span className="font-medium">Students:</span>{" "}
                      {seedingData.students}
                    </div>
                    <div>
                      <span className="font-medium">Courses:</span>{" "}
                      {seedingData.courses}
                    </div>
                    <div>
                      <span className="font-medium">Department Courses:</span>{" "}
                      {seedingData.departmentCourses}
                    </div>
                    <div>
                      <span className="font-medium">Course Assignments:</span>{" "}
                      {seedingData.courseAssignments}
                    </div>
                    <div>
                      <span className="font-medium">Admins:</span>{" "}
                      {seedingData.departmentAdmins +
                        seedingData.schoolAdmins +
                        seedingData.senateAdmins}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSeedingOpen(false)}
                  disabled={seeding}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {seeding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Seed Database
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation buttons */}
      {currentView !== "schools" && currentUser?.role === "SENATE_ADMIN" && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackToSchools}>
            ← Back to Schools
          </Button>
          {currentView === "users" && (
            <Button variant="outline" onClick={handleBackToDepartments}>
              ← Back to Departments
            </Button>
          )}
        </div>
      )}

      {currentView === "departments" &&
        currentUser?.role === "SCHOOL_ADMIN" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackToDepartments}>
              ← Back to Departments
            </Button>
          </div>
        )}

      {currentView === "users" && currentUser?.role === "DEPARTMENT_ADMIN" && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackToUserTypes}>
            ← Back to User Types
          </Button>
        </div>
      )}

      {/* Content based on current view */}
      {currentView === "schools" && renderSchoolsView()}
      {currentView === "departments" && renderDepartmentsView()}
      {currentView === "user-types" && renderUserTypesView()}
      {currentView === "users" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  +5 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  85% of total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.role === "STUDENT").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  67% of total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lecturers</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.role === "LECTURER").length}
                </div>
                <p className="text-xs text-muted-foreground">Teaching staff</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STUDENT">Students</SelectItem>
                <SelectItem value="LECTURER">Lecturers</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {userDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading users...
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Phone
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Last Login
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Courses
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{user.name}</span>
                          {getStatusIcon(user.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {user.department}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.phone ? (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{user.lastLogin}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          {user.enrolledCourses &&
                            user.enrolledCourses.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground">
                                  Enrolled:
                                </span>
                                {user.enrolledCourses
                                  .slice(0, 2)
                                  .map((course) => (
                                    <Badge
                                      key={course}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {course}
                                    </Badge>
                                  ))}
                                {user.enrolledCourses.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.enrolledCourses.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          {user.teachingCourses &&
                            user.teachingCourses.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground">
                                  Teaching:
                                </span>
                                {user.teachingCourses
                                  .slice(0, 2)
                                  .map((course) => (
                                    <Badge
                                      key={course}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {course}
                                    </Badge>
                                  ))}
                                {user.teachingCourses.length > 2 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{user.teachingCourses.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          {(!user.enrolledCourses ||
                            user.enrolledCourses.length === 0) &&
                            (!user.teachingCourses ||
                              user.teachingCourses.length === 0) && (
                              <span className="text-muted-foreground text-xs">
                                -
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleStatus(user.id, user.status)
                            }
                            className="h-8 w-8 p-0"
                            title={
                              user.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            {user.status === "active" ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user.id)}
                            className="h-8 w-8 p-0"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default withDashboardLayout(UserManagement);
