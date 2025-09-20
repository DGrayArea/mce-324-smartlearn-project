import React, { useState, useEffect } from "react";
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

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
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

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
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
  };

  // Fetch departments and schools for create user form
  const fetchDepartmentsAndSchools = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartmentsAndSchools();
  }, []);

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

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const departments = Array.from(new Set(users.map((u) => u.department)));

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across the platform.
          </p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
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
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                Loading users...
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          {getStatusIcon(user.status)}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{user.department}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {user.joinDate}</span>
                          <span>• Last login {user.lastLogin}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>

                  {(user.enrolledCourses || user.teachingCourses) && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {user.enrolledCourses && (
                          <div>
                            <span className="text-sm text-muted-foreground mr-2">
                              Enrolled:
                            </span>
                            {user.enrolledCourses.map((course) => (
                              <Badge
                                key={course}
                                variant="outline"
                                className="mr-1"
                              >
                                {course}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {user.teachingCourses && (
                          <div>
                            <span className="text-sm text-muted-foreground mr-2">
                              Teaching:
                            </span>
                            {user.teachingCourses.map((course) => (
                              <Badge
                                key={course}
                                variant="secondary"
                                className="mr-1"
                              >
                                {course}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user.id, user.status)}
                    >
                      {user.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(UserManagement);
