import React, { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Monitor,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";

const Settings = () => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Account settings
    firstName: (user?.name ? user.name.split(" ")[0] : "") || "",
    lastName: (user?.name ? user.name.split(" ").slice(1).join(" ") : "") || "",
    email: user?.email || "",
    title: "",
    matricNumber: "",
    staffId: "",
    adminId: "",
    phone: "",
    address: "",
    emergencyContact: "",
    bio: "",

    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true,
    forumUpdates: false,

    // Privacy settings
    profileVisible: true,
    showEmail: false,
    showLastLogin: true,

    // Appearance settings
    theme: "system",
    language: "en",
    timezone: "UTC-5",

    // Security settings
    twoFactorAuth: false,
    sessionTimeout: "30",
  });

  // Load role-specific profile fields from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) return;
        const data = await res.json();
        setSettings((prev) => ({
          ...prev,
          firstName:
            (data?.firstName ?? (user?.name ? user.name.split(" ")[0] : "")) ||
            "",
          lastName:
            (data?.lastName ??
              (user?.name ? user.name.split(" ").slice(1).join(" ") : "")) ||
            "",
          email: data?.email ?? user?.email ?? "",
          title: data?.title ?? "",
          matricNumber: data?.matricNumber ?? "",
          staffId: data?.staffId ?? "",
          adminId: data?.adminId ?? "",
          phone: data?.phone ?? "",
          address: data?.address ?? "",
          emergencyContact: data?.emergencyContact ?? "",
          // department label stored separately below
        }));
        // Store department/school label in a derived state field
        const deptLabel = data?.department?.name
          ? `${data.department.name} (${data.department.code})`
          : data?.school?.name
            ? `${data.school.name} (${data.school.code})`
            : "";
        setDepartmentLabel(deptLabel);
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  const [departmentLabel, setDepartmentLabel] = useState("");

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Button
          onClick={async () => {
            const fn = (settings.firstName || "").trim();
            const ln = (settings.lastName || "").trim();
            if (!fn || !ln) return;
            const body = {
              firstName: fn,
              lastName: ln,
              email: settings.email,
              ...(settings.title ? { title: settings.title } : {}),
              ...(settings.matricNumber
                ? { matricNumber: settings.matricNumber }
                : {}),
              ...(settings.staffId ? { staffId: settings.staffId } : {}),
              ...(settings.adminId ? { adminId: settings.adminId } : {}),
              ...(settings.phone ? { phone: settings.phone } : {}),
              ...(settings.address ? { address: settings.address } : {}),
              ...(settings.emergencyContact
                ? { emergencyContact: settings.emergencyContact }
                : {}),
            };
            try {
              setIsSaving(true);
              const resp = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
              const data = await resp.json().catch(() => ({}));
              if (!resp.ok) {
                toast({
                  title: "Update failed",
                  description: data?.message || "Unable to save profile",
                  variant: "destructive",
                });
                return;
              }
              toast({
                title: "Profile updated",
                description: "Your profile changes were saved successfully.",
              });
            } catch (e) {
              toast({
                title: "Network error",
                description: "Please check your connection and try again.",
                variant: "destructive",
              });
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(user?.role === "LECTURER" || user?.role?.includes("ADMIN")) && (
                <div className="space-y-2">
                  <Label htmlFor="title">Title (e.g., Engr, Dr, Prof)</Label>
                  <Input
                    id="title"
                    value={settings.title}
                    onChange={(e) =>
                      handleSettingChange("title", e.target.value)
                    }
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={settings.firstName}
                    onChange={(e) =>
                      handleSettingChange("firstName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={settings.lastName}
                    onChange={(e) =>
                      handleSettingChange("lastName", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange("email", e.target.value)}
                />
              </div>

              {user?.role === "STUDENT" && (
                <div className="space-y-2">
                  <Label htmlFor="matricNumber">
                    Matric Number (e.g., 2022/1/82345ET)
                  </Label>
                  <Input
                    id="matricNumber"
                    value={settings.matricNumber}
                    onChange={(e) =>
                      handleSettingChange("matricNumber", e.target.value)
                    }
                    disabled
                  />
                </div>
              )}

              {user?.role === "LECTURER" && (
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    value={settings.staffId}
                    onChange={(e) =>
                      handleSettingChange("staffId", e.target.value)
                    }
                    disabled
                  />
                </div>
              )}

              {user?.role === "STUDENT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) =>
                        handleSettingChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) =>
                        handleSettingChange("address", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={settings.emergencyContact}
                      onChange={(e) =>
                        handleSettingChange("emergencyContact", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {(user?.role === "DEPARTMENT_ADMIN" ||
                user?.role === "SCHOOL_ADMIN" ||
                user?.role === "SENATE_ADMIN") && (
                <div className="space-y-2">
                  <Label htmlFor="adminId">Admin ID</Label>
                  <Input
                    id="adminId"
                    value={settings.adminId}
                    onChange={(e) =>
                      handleSettingChange("adminId", e.target.value)
                    }
                    disabled
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={settings.bio}
                  onChange={(e) => handleSettingChange("bio", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={departmentLabel} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange("emailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange("pushNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="assignmentReminders">
                    Assignment Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming deadlines
                  </p>
                </div>
                <Switch
                  id="assignmentReminders"
                  checked={settings.assignmentReminders}
                  onCheckedChange={(checked) =>
                    handleSettingChange("assignmentReminders", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="gradeNotifications">
                    Grade Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Be notified when grades are posted
                  </p>
                </div>
                <Switch
                  id="gradeNotifications"
                  checked={settings.gradeNotifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange("gradeNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="forumUpdates">Forum Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get updates from course discussions
                  </p>
                </div>
                <Switch
                  id="forumUpdates"
                  checked={settings.forumUpdates}
                  onCheckedChange={(checked) =>
                    handleSettingChange("forumUpdates", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Controls</CardTitle>
              <CardDescription>
                Manage your privacy and data sharing preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profileVisible">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch
                  id="profileVisible"
                  checked={settings.profileVisible}
                  onCheckedChange={(checked) =>
                    handleSettingChange("profileVisible", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showEmail">Show Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email in your public profile
                  </p>
                </div>
                <Switch
                  id="showEmail"
                  checked={settings.showEmail}
                  onCheckedChange={(checked) =>
                    handleSettingChange("showEmail", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showLastLogin">Show Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Display when you were last active
                  </p>
                </div>
                <Switch
                  id="showLastLogin"
                  checked={settings.showLastLogin}
                  onCheckedChange={(checked) =>
                    handleSettingChange("showLastLogin", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Preferences</CardTitle>
              <CardDescription>
                Customize the look and feel of your interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange("theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    handleSettingChange("language", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    handleSettingChange("timezone", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="UTC+0">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={async () => {
                    const current = (
                      document.getElementById(
                        "currentPassword"
                      ) as HTMLInputElement
                    )?.value;
                    const nextPw = (
                      document.getElementById("newPassword") as HTMLInputElement
                    )?.value;
                    const confirm = (
                      document.getElementById(
                        "confirmPassword"
                      ) as HTMLInputElement
                    )?.value;
                    if (!nextPw || nextPw !== confirm) return;
                    await fetch("/api/user/change-password", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        currentPassword: current,
                        newPassword: nextPw,
                      }),
                    });
                  }}
                >
                  Update Password
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorAuth">
                    Two-Factor Authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    handleSettingChange("twoFactorAuth", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">
                  Session Timeout (minutes)
                </Label>
                <Select
                  value={settings.sessionTimeout}
                  onValueChange={(value) =>
                    handleSettingChange("sessionTimeout", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withDashboardLayout(Settings);
