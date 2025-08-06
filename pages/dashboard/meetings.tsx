import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { meetings } from "@/lib/dummyData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Users, Link, Plus } from "lucide-react";
import { format } from "date-fns";
import { withDashboardLayout } from "@/lib/layoutWrappers";

const Meetings = () => {
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lecture":
        return Video;
      case "tutorial":
        return Users;
      case "exam":
        return Clock;
      default:
        return Calendar;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Virtual Meetings
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "lecturer"
              ? "Schedule and manage your virtual classes and meetings."
              : "Join your scheduled lectures and meetings."}
          </p>
        </div>
        {user?.role === "lecturer" && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.map((meeting) => {
          const TypeIcon = getTypeIcon(meeting.type);
          return (
            <Card key={meeting.id} className="overflow-hidden">
              <CardHeader className="border-b p-4">
                <div className="flex justify-between items-start">
                  <Badge variant={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TypeIcon className="h-4 w-4 mr-1" />
                    <span className="capitalize">{meeting.type}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{meeting.title}</CardTitle>
                <CardDescription>{meeting.course}</CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {format(new Date(meeting.date), "EEEE, MMM dd, yyyy")}
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>
                    {meeting.time} ({meeting.duration})
                  </span>
                </div>

                {meeting.attendees !== undefined && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {meeting.attendees}
                      {meeting.maxAttendees && `/${meeting.maxAttendees}`}{" "}
                      attendees
                    </span>
                  </div>
                )}

                {meeting.link && (
                  <div className="flex items-center text-sm text-primary">
                    <Link className="h-4 w-4 mr-2" />
                    <span className="truncate">Meeting Link Available</span>
                  </div>
                )}
              </CardContent>

              <div className="border-t p-4 flex justify-between">
                {meeting.status === "scheduled" && meeting.link ? (
                  <Button className="w-full">
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {user?.role === "lecturer" && (
                      <Button size="sm">Manage</Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default withDashboardLayout(Meetings);
