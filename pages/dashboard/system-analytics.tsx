import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Clock,
  Download,
  Eye,
  Activity,
  Database,
  Server,
  Wifi,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  changePercent: number;
  status: "good" | "warning" | "critical";
}

interface UsageStatistic {
  category: string;
  current: number;
  previous: number;
  unit: string;
}

const systemMetrics: SystemMetric[] = [
  {
    id: "1",
    name: "Server CPU Usage",
    value: 65,
    unit: "%",
    trend: "up",
    changePercent: 5.2,
    status: "warning",
  },
  {
    id: "2",
    name: "Memory Usage",
    value: 78,
    unit: "%",
    trend: "stable",
    changePercent: 0.8,
    status: "good",
  },
  {
    id: "3",
    name: "Database Connections",
    value: 142,
    unit: "active",
    trend: "up",
    changePercent: 12.3,
    status: "good",
  },
  {
    id: "4",
    name: "Network Latency",
    value: 45,
    unit: "ms",
    trend: "down",
    changePercent: -8.5,
    status: "good",
  },
  {
    id: "5",
    name: "Storage Usage",
    value: 82,
    unit: "%",
    trend: "up",
    changePercent: 3.2,
    status: "warning",
  },
  {
    id: "6",
    name: "Active Sessions",
    value: 1247,
    unit: "users",
    trend: "up",
    changePercent: 18.7,
    status: "good",
  },
];

const usageStatistics: UsageStatistic[] = [
  { category: "Total Users", current: 2847, previous: 2689, unit: "users" },
  { category: "Active Courses", current: 156, previous: 142, unit: "courses" },
  {
    category: "Assignments Submitted",
    current: 8942,
    previous: 7834,
    unit: "submissions",
  },
  { category: "Video Meetings", current: 234, previous: 198, unit: "meetings" },
  {
    category: "Messages Sent",
    current: 15678,
    previous: 13245,
    unit: "messages",
  },
  {
    category: "File Downloads",
    current: 5432,
    previous: 4876,
    unit: "downloads",
  },
];

const SystemAnalytics = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      good: "outline",
      warning: "default",
      critical: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case "stable":
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMetricIcon = (name: string) => {
    if (name.includes("CPU") || name.includes("Server"))
      return <Server className="h-4 w-4" />;
    if (name.includes("Memory") || name.includes("Storage"))
      return <Database className="h-4 w-4" />;
    if (name.includes("Network") || name.includes("Latency"))
      return <Wifi className="h-4 w-4" />;
    if (name.includes("Session") || name.includes("User"))
      return <Users className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  const calculateChange = (current: number, previous: number) => {
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            System Analytics
          </h2>
          <p className="text-muted-foreground">
            Monitor system performance, usage statistics, and platform health.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Live Dashboard
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system-health" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system-health">System Health</TabsTrigger>
          <TabsTrigger value="usage-statistics">Usage Statistics</TabsTrigger>
          <TabsTrigger value="performance-trends">
            Performance Trends
          </TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="system-health" className="space-y-6">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Response Time
                </CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245ms</div>
                <p className="text-xs text-muted-foreground">
                  Average response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Alerts
                </CardTitle>
                <Badge
                  variant="destructive"
                  className="h-4 w-4 rounded-full p-0"
                ></Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Warnings active</p>
              </CardContent>
            </Card>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getMetricIcon(metric.name)}
                    {getStatusBadge(metric.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-2">
                    <div
                      className={`text-2xl font-bold ${getStatusColor(metric.status)}`}
                    >
                      {metric.value}
                      {metric.unit}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span
                        className={`text-xs ${metric.trend === "up" ? "text-green-600" : metric.trend === "down" ? "text-red-600" : "text-blue-600"}`}
                      >
                        {Math.abs(metric.changePercent)}%
                      </span>
                    </div>
                  </div>
                  {(metric.unit === "%" || metric.name.includes("Usage")) && (
                    <Progress value={metric.value} className="h-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage-statistics" className="space-y-6">
          <div className="grid gap-6">
            {usageStatistics.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{stat.category}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="text-2xl font-bold">
                          {stat.current.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Previous: {stat.previous.toLocaleString()} {stat.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          parseInt(
                            calculateChange(stat.current, stat.previous)
                          ) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {parseInt(
                          calculateChange(stat.current, stat.previous)
                        ) > 0
                          ? "+"
                          : ""}
                        {calculateChange(stat.current, stat.previous)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        vs previous period
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress
                      value={Math.min(
                        (stat.current / Math.max(stat.current, stat.previous)) *
                          100,
                        100
                      )}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance-trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>System performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Performance trend charts would be displayed here</p>
                  <p className="text-sm">
                    Integration with charting library (e.g., Recharts)
                    recommended
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-full bg-yellow-100">
                    <Badge
                      variant="default"
                      className="h-4 w-4 rounded-full p-0"
                    ></Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">High Storage Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Storage usage is at 82%. Consider cleaning up old files or
                      adding more storage.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Triggered: 2024-01-20 14:30
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Acknowledge
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-full bg-yellow-100">
                    <Badge
                      variant="default"
                      className="h-4 w-4 rounded-full p-0"
                    ></Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Increased CPU Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      CPU usage has increased to 65%. Monitor for potential
                      performance issues.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Triggered: 2024-01-20 13:45
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Acknowledge
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withDashboardLayout(SystemAnalytics);
