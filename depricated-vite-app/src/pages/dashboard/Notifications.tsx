import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, FileText, Award, Users, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'announcement' | 'reminder' | 'deadline' | 'grade';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  course?: string;
  actionUrl?: string;
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'announcement',
    title: 'New Course Material Available',
    message: 'CS101 - Introduction to Computer Science: New lecture slides and assignments have been uploaded.',
    timestamp: '2024-01-20 14:30',
    read: false,
    priority: 'medium',
    course: 'CS101',
    actionUrl: '/dashboard/courses'
  },
  {
    id: '2',
    type: 'deadline',
    title: 'Assignment Due Tomorrow',
    message: 'Binary Search Implementation project is due tomorrow at 11:59 PM.',
    timestamp: '2024-01-19 16:00',
    read: false,
    priority: 'high',
    course: 'CS201',
    actionUrl: '/dashboard/assignments'
  },
  {
    id: '3',
    type: 'grade',
    title: 'New Grade Posted',
    message: 'Your grade for React Calculator App has been posted: 92/100',
    timestamp: '2024-01-18 10:15',
    read: true,
    priority: 'medium',
    course: 'CS302',
    actionUrl: '/dashboard/grades'
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Virtual Meeting in 30 Minutes',
    message: 'Database Design Workshop starts at 2:00 PM today.',
    timestamp: '2024-01-17 13:30',
    read: false,
    priority: 'high',
    course: 'CS301',
    actionUrl: '/dashboard/meetings'
  },
  {
    id: '5',
    type: 'announcement',
    title: 'System Maintenance Notice',
    message: 'Scheduled maintenance will occur this weekend from 2:00 AM to 6:00 AM on Saturday.',
    timestamp: '2024-01-16 09:00',
    read: true,
    priority: 'low'
  }
];

const Notifications = () => {
  const { user } = useAuth();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Users className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'deadline': return <Calendar className="h-4 w-4" />;
      case 'grade': return <Award className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-500';
    if (priority === 'medium') return 'text-orange-500';
    return 'text-blue-500';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with announcements, deadlines, and important information.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {unreadCount} Unread
          </Badge>
          <Button variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={cn(
            "transition-all hover:shadow-md cursor-pointer",
            !notification.read && "border-l-4 border-l-primary bg-muted/30"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    getNotificationColor(notification.type, notification.priority),
                    !notification.read ? "bg-primary/10" : "bg-muted"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{notification.timestamp}</span>
                      {notification.course && (
                        <>
                          <span>•</span>
                          <span>{notification.course}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getPriorityBadge(notification.priority)}
                  <Badge variant="outline" className="text-xs">
                    {notification.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {notification.message}
              </p>
              {notification.actionUrl && (
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notifications;