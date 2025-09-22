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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Database,
  Server,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Zap,
  HardDrive,
  Wifi,
} from "lucide-react";

interface PerformanceMetrics {
  system: {
    avgResponseTime: number;
    requestsPerMinute: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
    status: string;
  };
  database: {
    avgQueryTime: number;
    totalQueries: number;
    slowQueries: number;
    connectionPool: {
      active: number;
      idle: number;
      max: number;
    };
    status: string;
  };
  api: {
    totalAPICalls: number;
    avgAPITime: number;
    endpointStats: Record<string, { count: number; avgTime: number }>;
    status: string;
  };
  userActivity: {
    activeUsers: number;
    totalUsers: number;
    concurrentUsers: number;
    avgSessionDuration: number;
    status: string;
  };
  timeRange: string;
  generatedAt: string;
}

const PerformanceMetrics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(
    async (range: string = timeRange) => {
      try {
        setRefreshing(true);
        const response = await fetch(
          `/api/analytics/performance?timeRange=${range}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch performance metrics");
        }

        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching performance metrics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch performance metrics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange, toast]
  );

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    fetchMetrics(newRange);
  };

  const handleRefresh = () => {
    fetchMetrics();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance Metrics</h1>
            <p className="text-muted-foreground">
              Real-time system performance monitoring
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance Metrics</h1>
            <p className="text-muted-foreground">
              Real-time system performance monitoring
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Unable to fetch performance metrics at this time.
            </p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Metrics</h1>
          <p className="text-muted-foreground">
            Real-time system performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(metrics.system.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.system.uptime}%</div>
            <p className="text-xs text-muted-foreground">Uptime</p>
            <Badge className={`mt-2 ${getStatusColor(metrics.system.status)}`}>
              {metrics.system.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.system.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">Average</p>
            <Progress
              value={Math.min(
                (metrics.system.avgResponseTime / 1000) * 100,
                100
              )}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.system.requestsPerMinute}
            </div>
            <p className="text-xs text-muted-foreground">Current rate</p>
            <div className="text-xs text-muted-foreground mt-1">
              Total: {metrics.system.totalRequests.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.system.errorRate}%
            </div>
            <p className="text-xs text-muted-foreground">Last {timeRange}</p>
            <Progress value={metrics.system.errorRate * 20} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Database Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Performance
            {getStatusIcon(metrics.database.status)}
          </CardTitle>
          <CardDescription>
            Database query performance and connection statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold">
                {metrics.database.avgQueryTime}ms
              </div>
              <p className="text-sm text-muted-foreground">
                Average Query Time
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.database.totalQueries.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Queries</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.database.slowQueries}
              </div>
              <p className="text-sm text-muted-foreground">Slow Queries</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Connection Pool</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {metrics.database.connectionPool.active}
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {metrics.database.connectionPool.idle}
                </div>
                <p className="text-xs text-muted-foreground">Idle</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">
                  {metrics.database.connectionPool.max}
                </div>
                <p className="text-xs text-muted-foreground">Max</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            API Performance
            {getStatusIcon(metrics.api.status)}
          </CardTitle>
          <CardDescription>
            API endpoint performance and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-bold">
                {metrics.api.avgAPITime}ms
              </div>
              <p className="text-sm text-muted-foreground">
                Average API Response Time
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.api.totalAPICalls.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total API Calls</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Top Endpoints</h4>
            <div className="space-y-2">
              {Object.entries(metrics.api.endpointStats)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 5)
                .map(([endpoint, stats]) => (
                  <div
                    key={endpoint}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm font-medium">{endpoint}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">
                        {Math.round(stats.avgTime)}ms avg
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {stats.count} calls
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Activity
            {getStatusIcon(metrics.userActivity.status)}
          </CardTitle>
          <CardDescription>
            User engagement and session statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold">
                {metrics.userActivity.activeUsers}
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.userActivity.concurrentUsers}
              </div>
              <p className="text-sm text-muted-foreground">Concurrent Users</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.userActivity.totalUsers}
              </div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.userActivity.avgSessionDuration}m
              </div>
              <p className="text-sm text-muted-foreground">
                Avg Session Duration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(metrics.generatedAt).toLocaleString()}
      </div>
    </div>
  );
};

export default withDashboardLayout(PerformanceMetrics);
