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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Calendar,
  Clock,
  BarChart3,
  Users,
  TrendingUp,
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    student?: {
      matricNumber: string;
      level: string;
      department: {
        name: string;
        code: string;
      };
    };
    lecturer?: {
      department: {
        name: string;
        code: string;
      };
    };
  };
}

interface ActivityStats {
  action: string;
  _count: {
    action: number;
  };
}

interface UserActivitySummary {
  userId: string;
  _count: {
    userId: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const UserActivityMonitoring = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats[]>([]);
  const [userActivitySummary, setUserActivitySummary] = useState<
    UserActivitySummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchUserActivity = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAction) params.append("action", selectedAction);
      if (selectedEntity) params.append("entity", selectedEntity);
      if (selectedUser) params.append("userId", selectedUser);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/admin/user-activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setStats(data.stats);
        setUserActivitySummary(data.userActivitySummary);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch user activity data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user activity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAction, selectedEntity, selectedUser, startDate, endDate, toast]);

  useEffect(() => {
    fetchUserActivity();
  }, [fetchUserActivity]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "login":
        return "bg-green-100 text-green-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "create":
        return "bg-blue-100 text-blue-800";
      case "update":
        return "bg-yellow-100 text-yellow-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "download":
        return "bg-purple-100 text-purple-800";
      case "upload":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "bg-blue-100 text-blue-800";
      case "LECTURER":
        return "bg-green-100 text-green-800";
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            User Activity Monitoring
          </h2>
          <p className="text-muted-foreground">
            Monitor user actions and system activity across the platform
          </p>
        </div>
        <Button onClick={fetchUserActivity} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Activities
                </p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Users
                </p>
                <p className="text-2xl font-bold">
                  {userActivitySummary.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Action Types
                </p>
                <p className="text-2xl font-bold">{stats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Most Active
                </p>
                <p className="text-2xl font-bold">
                  {stats.length > 0 ? stats[0].action : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter activity logs by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Entity</label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Entities</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSelectedAction("");
                  setSelectedEntity("");
                  setSelectedUser("");
                  setStartDate("");
                  setEndDate("");
                  setSearchTerm("");
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Statistics (Last 30 Days)</CardTitle>
            <CardDescription>Most common actions performed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.slice(0, 10).map((stat) => (
                <div
                  key={stat.action}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Badge className={getActionColor(stat.action)}>
                      {stat.action}
                    </Badge>
                  </div>
                  <span className="font-semibold">{stat._count.action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Active Users (Last 7 Days)</CardTitle>
            <CardDescription>
              Users with highest activity levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userActivitySummary.slice(0, 10).map((userActivity) => (
                <div
                  key={userActivity.userId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="font-medium">
                        {userActivity.user?.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userActivity.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {userActivity._count.userId}
                    </p>
                    <Badge
                      className={getRoleColor(userActivity.user?.role || "")}
                    >
                      {userActivity.user?.role || "Unknown"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>Detailed log of all user activities</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.user.email}
                          </p>
                          <Badge className={getRoleColor(log.user.role)}>
                            {log.user.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{log.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredLogs.length === 0 && !loading && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
              <p className="text-muted-foreground">
                No activity logs match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardLayout(UserActivityMonitoring);
