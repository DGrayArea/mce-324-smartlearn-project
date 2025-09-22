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
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  Video,
  Award,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const url = showUnreadOnly
        ? "/api/notifications?unreadOnly=true"
        : "/api/notifications";

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive",
        });
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

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notifications marked as read",
        });
        fetchNotifications();
      } else {
        toast({
          title: "Error",
          description: "Failed to mark notifications as read",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
        fetchNotifications();
      } else {
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read",
          variant: "destructive",
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

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notifications deleted",
        });
        fetchNotifications();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      });
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm("Are you sure you want to delete all notifications?")) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "All notifications deleted",
        });
        fetchNotifications();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete all notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      toast({
        title: "Error",
        description: "Failed to delete all notifications",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Video className="h-5 w-5 text-blue-600" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case "grade":
        return <Award className="h-5 w-5 text-yellow-600" />;
      case "announcement":
        return <FileText className="h-5 w-5 text-purple-600" />;
      case "deadline":
        return <Calendar className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800";
      case "message":
        return "bg-green-100 text-green-800";
      case "grade":
        return "bg-yellow-100 text-yellow-800";
      case "announcement":
        return "bg-purple-100 text-purple-800";
      case "deadline":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with your latest activities and important announcements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center space-x-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All Read</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={deleteAllNotifications}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant={showUnreadOnly ? "default" : "outline"}
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className="flex items-center space-x-2"
        >
          {showUnreadOnly ? (
            <>
              <BellOff className="h-4 w-4" />
              <span>Show All</span>
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              <span>Unread Only</span>
            </>
          )}
        </Button>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.isRead
                  ? "border-l-4 border-l-primary bg-primary/5"
                  : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                          >
                            {notification.type}
                          </Badge>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead([notification.id])}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotifications([notification.id])}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {notifications.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
            <p className="text-muted-foreground">
              {showUnreadOnly
                ? "You have no unread notifications."
                : "You have no notifications yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default withDashboardLayout(Notifications);
