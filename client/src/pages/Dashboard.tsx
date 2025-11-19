import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/components/ui/currency-input";
import { 
  UserPlus, 
  TestTube, 
  IndianRupee, 
  FileText,
  TrendingUp,
  Activity,
  BarChart3,
  LineChart,
  Calendar,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart as RechartsLineChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Bar,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

  // Type definitions
interface Activity {
  id: string;
  action: string;
  entity: string;
  timestamp: string;
  type: 'lead' | 'sample' | 'report' | 'payment';
  userId: string;
  details?: string;
}

interface PerformanceMetrics {
  leadConversionRate: number;
  exceedingTAT: number;
  customerSatisfaction: number;
  monthlyRevenue: number;
  activeSamples: number;
  completedReports: number;
  pendingApprovals: number;
  revenueGrowth: number;
}export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Query for recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['/api/dashboard/recent-activities'],
    refetchInterval: 15000, // Refresh every 15 seconds for real-time activity updates
  });

  // Query for performance metrics
  const { data: performanceMetrics } = useQuery({
    queryKey: ['/api/dashboard/performance-metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Sample revenue data - In a real application, this would come from your API
  const weeklyRevenueData = [
    { week: 'Week 1', actual: 180000, target: 200000 },
    { week: 'Week 2', actual: 210000, target: 220000 },
    { week: 'Week 3', actual: 195000, target: 220000 },
    { week: 'Week 4', actual: 240000, target: 230000 },
  ];

  const monthlyRevenueData = [
    { month: 'Jan 2025', actual: 750000, target: 850000 },
    { month: 'Feb 2025', actual: 820000, target: 900000 },
    { month: 'Mar 2025', actual: 890000, target: 950000 },
    { month: 'Apr 2025', actual: 950000, target: 1000000 },
    { month: 'May 2025', actual: 1020000, target: 1100000 },
    { month: 'Jun 2025', actual: 1150000, target: 1200000 },
    { month: 'Jul 2025', actual: 1080000, target: 1150000 },
    { month: 'Aug 2025', actual: 1200000, target: 1300000 },
    { month: 'Sep 2025', actual: 1180000, target: 1250000 },
    { month: 'Oct 2025', actual: 1350000, target: 1400000 },
    { month: 'Nov 2025', actual: null, target: 1450000 },
    { month: 'Dec 2025', actual: null, target: 1600000 },
  ];

  const yearlyRevenueData = [
    { year: 'FY 2020-21', actual: 8500000, target: 9000000 },
    { year: 'FY 2021-22', actual: 10200000, target: 11000000 },
    { year: 'FY 2022-23', actual: 12800000, target: 13500000 },
    { year: 'FY 2023-24', actual: 15600000, target: 16000000 },
    { year: 'FY 2024-25', actual: 12450000, target: 19000000 },
    { year: 'FY 2025-26', actual: null, target: 23000000 },
    { year: 'FY 2026-27', actual: null, target: 28000000 },
  ];

  const revenueBreakdownData = [
    { category: 'WGS', revenue: 4200000, percentage: 35 },
    { category: 'WES', revenue: 3600000, percentage: 30 },
    { category: 'Pharmacogenomics', revenue: 2400000, percentage: 20 },
    { category: 'Counselling', revenue: 1200000, percentage: 10 },
    { category: 'Others', revenue: 600000, percentage: 5 },
  ];

  const statsCards = [
    {
      title: "Active Leads",
      value: (stats as any)?.activeLeads || 0,
      icon: UserPlus,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
  title: "Samples Processing",
  value: (stats as any)?.samplesProcessing || 0,
      icon: TestTube,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
  title: "Pending Revenue",
  value: `₹${formatINR((stats as any)?.pendingRevenue || 0)}`,
      icon: IndianRupee,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
  title: "Reports Pending",
  value: (stats as any)?.reportsPending || 0,
      icon: FileText,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  const formatCurrency = (value: number) => {
    return `₹${(value / 100000).toFixed(1)}L`;
  };

  const formatTooltipCurrency = (value: number) => {
    return `₹${formatINR(value)}`;
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown time';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return `${Math.floor(diffInSeconds / 604800)}w ago`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead': return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'sample': return <TestTube className="w-4 h-4 text-green-600" />;
      case 'report': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'payment': return <IndianRupee className="w-4 h-4 text-orange-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get activity color based on type
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'sample': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'report': return 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800';
      case 'payment': return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  // Default activities if API is not available
  const defaultActivities: Activity[] = [
    { 
      id: '1',
      action: "New lead created", 
      entity: "Apollo Hospitals - WGS", 
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), 
      type: "lead",
      userId: "system",
      details: "New lead from Apollo Hospitals for WGS analysis"
    },
    { 
      id: '2',
      action: "Sample processed", 
      entity: "PG202508071702", 
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), 
      type: "sample",
      userId: "lab_tech_1",
      details: "Sample processing completed successfully"
    },
    { 
      id: '3',
      action: "Report approved", 
      entity: "DG202508061445", 
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), 
      type: "report",
      userId: "supervisor_1",
      details: "Genetic report reviewed and approved"
    },
    { 
      id: '4',
      action: "Payment received", 
      entity: "₹45,000", 
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 
      type: "payment",
      userId: "finance_1",
      details: "Payment processed for completed analysis"
    },
  ];

  // Default performance metrics if API is not available
  const defaultMetrics: PerformanceMetrics = {
    leadConversionRate: 78.5,
    exceedingTAT: 12,
    customerSatisfaction: 94.2,
    monthlyRevenue: 1350000,
    activeSamples: 45,
    completedReports: 128,
    pendingApprovals: 8,
    revenueGrowth: 15.3
  };

  const activities = (recentActivities as Activity[]) || defaultActivities;
  const metrics = (performanceMetrics as PerformanceMetrics) || defaultMetrics;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor your laboratory operations and key metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Analytics Section */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue Analytics</h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Track revenue performance and projections
              </p>
            </div>
            <div className="space-x-2">
              <Button 
                variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button 
                variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('monthly')}
              >
                Monthly
              </Button>
              <Button 
                variant={selectedPeriod === 'yearly' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('yearly')}
              >
                Yearly
              </Button>
            </div>
          </div>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      YTD Revenue
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹1.25Cr
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Annual Target
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹1.9Cr
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <LineChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Projected YE
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹1.85Cr
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      This Month
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹13.5L
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Revenue Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="mr-2 h-5 w-5" />
                Monthly Revenue Trends & Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={selectedPeriod === 'weekly' 
                      ? weeklyRevenueData 
                      : selectedPeriod === 'yearly' 
                        ? yearlyRevenueData 
                        : monthlyRevenueData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={
                        selectedPeriod === 'weekly' 
                          ? 'week' 
                          : selectedPeriod === 'yearly' 
                            ? 'year' 
                            : 'month'
                      } 
                    />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatTooltipCurrency(value), 
                        name === 'actual' ? 'Actual Revenue' : 'Target Revenue'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="actual" fill="#10b981" name="Actual Revenue" />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      name="Target Revenue" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Yearly Revenue Projection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Yearly Revenue Outlook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatTooltipCurrency(value), 
                        name === 'actual' ? 'Actual Revenue' : 'Target Revenue'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="actual" fill="#10b981" name="Actual" />
                    <Bar dataKey="target" fill="#fbbf24" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Revenue by Service Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBreakdownData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ 
                          backgroundColor: [
                            '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'
                          ][index] 
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{formatINR(item.revenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueBreakdownData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value: number) => formatTooltipCurrency(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Activity
              </div>
              <Badge variant="outline" className="text-xs">
                Live Updates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {activities.map((activity: Activity, index: number) => (
                <div 
                  key={activity.id || index} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.action}
                      </p>
                      <Badge variant="outline" className="text-xs ml-2">
                        {formatTimeAgo(activity.timestamp)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.entity}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Activity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Performance Metrics
              </div>
              <Badge variant="outline" className="text-xs">
                Real-time
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Lead Conversion Rate</span>
                  <span className="text-sm font-semibold text-green-600">{metrics.leadConversionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${metrics.leadConversionRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Number of exceeding TAT</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{metrics.exceedingTAT}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">+{metrics.revenueGrowth}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">₹{formatINR(metrics.monthlyRevenue)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Samples</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{metrics.activeSamples}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed Reports</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{metrics.completedReports}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{metrics.pendingApprovals}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
