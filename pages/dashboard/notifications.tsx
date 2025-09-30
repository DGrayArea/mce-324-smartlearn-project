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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCircle,
  Circle,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  MessageSquare,
  BookOpen,
  Video,
  Award,
  Users,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterRead !== "all") params.append("isRead", filterRead);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setNotifications(data.notifications || []);
      } else {
        throw new Error(data.message || "Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterRead]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
        toast({
          title: "Success",
          description: "Notification deleted",
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "VIRTUAL_CLASS":
        return <Video className="h-4 w-4 text-blue-600" />;
      case "GRADE":
        return <Award className="h-4 w-4 text-green-600" />;
      case "COURSE_REGISTRATION":
        return <BookOpen className="h-4 w-4 text-purple-600" />;
      case "ANNOUNCEMENT":
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case "DEADLINE":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "REMINDER":
        return <Bell className="h-4 w-4 text-yellow-600" />;
      case "SYSTEM":
        return <HelpCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      VIRTUAL_CLASS: "bg-blue-100 text-blue-800",
      GRADE: "bg-green-100 text-green-800",
      COURSE_REGISTRATION: "bg-purple-100 text-purple-800",
      ANNOUNCEMENT: "bg-orange-100 text-orange-800",
      DEADLINE: "bg-red-100 text-red-800",
      REMINDER: "bg-yellow-100 text-yellow-800",
      SYSTEM: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={typeColors[type] || "bg-gray-100 text-gray-800"}>
        {type.replace("_", " ").toLowerCase()}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = notifications.filter((notification) => {
    if (filterType !== "all" && notification.type !== filterType) return false;
    if (filterRead === "read" && !notification.isRead) return false;
    if (filterRead === "unread" && notification.isRead) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with your academic activities and important
            announcements
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total
                </p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Circle className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Unread
                </p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Read
                </p>
                <p className="text-2xl font-bold">
                  {notifications.length - unreadCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="VIRTUAL_CLASS">Virtual Class</SelectItem>
                  <SelectItem value="GRADE">Grade</SelectItem>
                  <SelectItem value="COURSE_REGISTRATION">
                    Course Registration
                  </SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                  <SelectItem value="DEADLINE">Deadline</SelectItem>
                  <SelectItem value="REMINDER">Reminder</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notification
            {filteredNotifications.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? "bg-muted/50 border-muted"
                      : "bg-background border-border shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {notification.isRead ? (
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Circle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <h3
                            className={`font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {notification.title}
                          </h3>
                          {getNotificationBadge(notification.type)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatTime(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                No notifications found for the selected filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardLayout(Notifications);
