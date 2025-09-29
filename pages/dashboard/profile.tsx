import React, { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Edit,
  Phone,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";

const Profile = () => {
  const { user } = useAuth();
  const [roleData, setRoleData] = useState<any>({});
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) return;
        const data = await res.json();
        setRoleData(data);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const getProfileData = () => {
    switch (user?.role) {
      case "STUDENT":
        return {
          achievements: [
            { title: "Dean's List", description: "Fall 2023", icon: Award },
            {
              title: "Programming Champion",
              description: "Hackathon Winner",
              icon: GraduationCap,
            },
            {
              title: "Perfect Attendance",
              description: "2 Semesters",
              icon: Calendar,
            },
          ],
          stats: [
            { label: "GPA", value: "3.85" },
            { label: "Courses Completed", value: "18" },
            { label: "Credits Earned", value: "54" },
            { label: "Study Hours", value: "420h" },
          ],
          additionalInfo: {
            phone: "+1 (555) 123-4567",
            address: "123 University Ave, Campus City",
            emergencyContact: "Jane Johnson - +1 (555) 987-6543",
            advisor: "Dr. Robert Smith",
          },
        };
      case "LECTURER":
        return {
          achievements: [
            {
              title: "Excellence in Teaching",
              description: "2023 Award",
              icon: Award,
            },
            {
              title: "Research Publication",
              description: "15 Papers",
              icon: BookOpen,
            },
            {
              title: "Student Favorite",
              description: "4.9/5 Rating",
              icon: GraduationCap,
            },
          ],
          stats: [
            { label: "Years Teaching", value: "8" },
            { label: "Courses Taught", value: "12" },
            { label: "Students Mentored", value: "240+" },
            { label: "Research Papers", value: "15" },
          ],
          additionalInfo: {
            phone: "+1 (555) 234-5678",
            office: "Engineering Building, Room 304",
            officeHours: "Mon-Wed 2:00-4:00 PM",
            researchArea: "Database Systems & Machine Learning",
          },
        };
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
        return {
          achievements: [
            {
              title: "System Excellence",
              description: "99.9% Uptime",
              icon: Award,
            },
            {
              title: "Process Improvement",
              description: "30% Efficiency Gain",
              icon: Briefcase,
            },
            {
              title: "Leadership Award",
              description: "Staff Recognition",
              icon: GraduationCap,
            },
          ],
          stats: [
            { label: "Years at University", value: "12" },
            { label: "Systems Managed", value: "25" },
            { label: "Users Supported", value: "1200+" },
            { label: "Projects Led", value: "8" },
          ],
          additionalInfo: {
            phone: "+1 (555) 345-6789",
            office: "Administration Building, Room 201",
            workingHours: "Mon-Fri 8:00 AM - 6:00 PM",
            specialization: "Academic Systems Administration",
          },
        };
      default:
        return { achievements: [], stats: [], additionalInfo: {} };
    }
  };

  const profileData = getProfileData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">
            {user?.role === "STUDENT"
              ? "View your profile information and achievements."
              : "Manage your profile information and view your achievements."}
          </p>
        </div>
        <Button onClick={() => (window.location.href = "/dashboard/settings")}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              />
              <AvatarFallback>
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{user?.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="capitalize">
                {user?.role}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {roleData?.department?.name
                  ? `${roleData.department.name} (${roleData.department.code})`
                  : roleData?.school?.name
                    ? `${roleData.school.name} (${roleData.school.code})`
                    : "Department"}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Joined {new Date().toLocaleDateString()}</span>
            </div>
            {user?.role === "STUDENT" && (
              <>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Student</span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Matric No:{" "}
                    {(user as any)?.studentId ||
                      (user as any)?.matricNumber ||
                      "—"}
                  </span>
                </div>
              </>
            )}
            {user?.role === "LECTURER" && (
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Staff ID: {roleData?.staffId || "—"}</span>
              </div>
            )}
            {(user?.role === "DEPARTMENT_ADMIN" ||
              user?.role === "SCHOOL_ADMIN" ||
              user?.role === "SENATE_ADMIN") && (
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Admin ID: {roleData?.adminId || "—"}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="achievements" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
            </TabsList>

            <TabsContent value="achievements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {achievement.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profileData.stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  {Object.entries(profileData.additionalInfo).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {value as string}
                        </span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(Profile);
