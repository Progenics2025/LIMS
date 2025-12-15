import { useState, useMemo, useEffect } from "react";
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
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Timer,
  ArrowUpRight,
  Dna
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportWithSample } from "@shared/schema";
import { Link } from "wouter";
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: reports = [] } = useQuery<ReportWithSample[]>({
    queryKey: ['/api/reports'],
  });

  // TAT Logic
  const processedReports = useMemo(() => {
    return reports.map(report => {
      // Calculate deadline based on sample received date and TAT
      // If sample received date is missing, use leadCreated as fallback
      const regDate = new Date(report.sample?.lead?.sampleReceivedDate || report.sample?.lead?.leadCreated || new Date());
      const tatHours = (Number(report.sample?.lead?.tat) || 0) * 24; // TAT is in days
      const deadline = new Date(regDate.getTime() + tatHours * 60 * 60 * 1000);
      const diffMs = deadline.getTime() - currentTime.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      
      let urgency = 'normal';
      if (report.status === 'delivered' || report.status === 'approved') {
        urgency = 'completed';
      } else if (diffHrs < 0) {
        urgency = 'overdue';
      } else if (diffHrs < 2) { 
        urgency = 'critical';
      } else if (diffHrs < 4) { 
        urgency = 'warning';
      }

      return { ...report, deadline, diffMs, diffHrs, urgency, tatHours };
    }).sort((a, b) => {
      const urgencyWeight: Record<string, number> = { overdue: 0, critical: 1, warning: 2, normal: 3, completed: 4 };
      if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
        return urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
      }
      return a.diffMs - b.diffMs;
    });
  }, [reports, currentTime]);

  const tatStats = {
    overdue: processedReports.filter(r => r.urgency === 'overdue').length,
    critical: processedReports.filter(r => r.urgency === 'critical').length,
    warning: processedReports.filter(r => r.urgency === 'warning').length,
    totalPending: processedReports.filter(r => r.status === 'in_progress' || r.status === 'awaiting_approval').length
  };
  
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

  const weeklyRevenueData: any[] = [];

  const monthlyRevenueData: any[] = [];

  const yearlyRevenueData: any[] = [];

  const revenueBreakdownData: any[] = [];

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
  const defaultActivities: Activity[] = [];

  // Default performance metrics if API is not available
  const defaultMetrics: PerformanceMetrics = {
    leadConversionRate: 0,
    exceedingTAT: 0,
    customerSatisfaction: 0,
    monthlyRevenue: 0,
    activeSamples: 0,
    completedReports: 0,
    pendingApprovals: 0,
    revenueGrowth: 0
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

      {/* TAT Alert Banner */}
      {(tatStats.overdue > 0 || tatStats.critical > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-xl p-4 shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h4 className="text-red-800 font-bold text-sm">TAT Limit Breached</h4>
              <p className="text-red-600 text-sm mt-0.5">
                {tatStats.overdue} overdue items require immediate validation.
              </p>
            </div>
          </div>
          <Link href="/reports">
            <Button variant="destructive" size="sm" className="bg-white text-red-600 border border-red-200 hover:bg-red-50 shadow-sm">
              Resolve Now
            </Button>
          </Link>
        </div>
      )}

      {/* TAT Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TATStatCard 
          title="Critical Overdue" 
          count={tatStats.overdue} 
          icon={AlertTriangle}
          colorClass="text-red-600"
          bgClass="bg-red-100"
          borderClass="bg-red-500"
          subText="Requires Validation"
        />
        <TATStatCard 
          title="High Risk (<2h)" 
          count={tatStats.critical} 
          icon={Timer}
          colorClass="text-orange-500"
          bgClass="bg-orange-100"
          borderClass="bg-orange-500"
          subText="Expiring Soon"
        />
        <TATStatCard 
          title="Approaching (<4h)" 
          count={tatStats.warning} 
          icon={Clock}
          colorClass="text-yellow-600"
          bgClass="bg-yellow-100"
          borderClass="bg-yellow-500"
          subText="Keep Monitor"
        />
        <TATStatCard 
          title="Active Workload" 
          count={tatStats.totalPending} 
          icon={Activity}
          colorClass="text-[#0085CA]"
          bgClass="bg-[#E6F6FD]"
          borderClass="bg-[#0085CA]"
          subText="Total Pending"
        />
      </div>

      {/* Live TAT Priority Queue & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-[#0B1139] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live TAT Priority Queue
            </h3>
            <Link href="/reports">
              <button className="text-[#0085CA] text-sm font-semibold hover:text-blue-800 flex items-center gap-1">
                Full Queue <ArrowUpRight size={16} />
              </button>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {processedReports
              .filter(r => r.status === 'in_progress' || r.status === 'awaiting_approval')
              .slice(0, 5)
              .map(report => (
                <div key={report.id} className="p-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={`w-1 h-12 rounded-full ${
                      report.urgency === 'overdue' ? 'bg-red-500' : 
                      report.urgency === 'critical' ? 'bg-orange-500' : 
                      report.urgency === 'warning' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}></div>
                    <div>
                      <h4 className="font-bold text-slate-700 group-hover:text-[#0085CA] transition-colors">{report.sample?.lead?.serviceName || 'Unknown Test'}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <span className="bg-slate-100 px-1.5 rounded text-xs font-medium text-slate-600">{report.sample?.uniqueId}</span>
                        {report.sample?.lead?.patientClientName || 'Unknown Patient'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <UrgencyBadge urgency={report.urgency} diffHrs={report.diffHrs} />
                    <p className="text-xs text-slate-400 mt-1 font-mono">Target: {report.tatHours}h</p>
                  </div>
                </div>
            ))}
            {processedReports.filter(r => r.status === 'in_progress' || r.status === 'awaiting_approval').length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No pending reports
              </div>
            )}
          </div>
        </div>

        {/* Side Widget - Progenics Themed */}
        <div className="bg-gradient-to-b from-[#0B1139] to-[#1a2255] rounded-2xl shadow-lg p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Dna size={120} />
          </div>
          <h3 className="text-lg font-bold mb-4 relative z-10">Quick Actions</h3>
          <div className="space-y-3 relative z-10">
            <Link href="/leads">
              <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm py-3 px-4 rounded-xl text-left text-sm font-medium flex items-center gap-3 transition-all border border-white/10 mb-3">
                <div className="bg-[#0085CA] p-1.5 rounded-lg">
                  <FileText size={16} />
                </div>
                Register New Sample
              </button>
            </Link>
            <Link href="/lab">
              <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm py-3 px-4 rounded-xl text-left text-sm font-medium flex items-center gap-3 transition-all border border-white/10">
                <div className="bg-emerald-500 p-1.5 rounded-lg">
                  <Activity size={16} />
                </div>
                Lab Process
              </button>
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
            <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Lab Efficiency</p>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold">0%</span>
              <span className="text-sm text-blue-200 mb-1">On Time</span>
            </div>
          </div>
        </div>
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
                      ₹0
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
                      ₹0
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
                      ₹0
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
                      ₹0
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

// Helper Components for TAT Dashboard
const UrgencyBadge = ({ urgency, diffHrs }: { urgency: string, diffHrs: number }) => {
  const formatTime = (hrs: number) => {
    const absHrs = Math.abs(hrs);
    const h = Math.floor(absHrs);
    const m = Math.floor((absHrs - h) * 60);
    return `${h}h ${m}m`;
  };

  const styles: Record<string, string> = {
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    overdue: "bg-red-50 text-red-700 border-red-200 animate-pulse",
    critical: "bg-orange-50 text-orange-700 border-orange-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    normal: "bg-[#E6F6FD] text-[#0085CA] border-blue-100"
  };

  const style = styles[urgency] || styles.normal;
  const labels: Record<string, string> = {
    completed: "Completed",
    overdue: `Overdue ${formatTime(diffHrs)}`,
    critical: `< 2h Remaining`,
    warning: `< 4h Remaining`,
    normal: `${formatTime(diffHrs)} Left`
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${style} shadow-sm`}>
      {urgency === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1.5" />}
      {urgency === 'critical' && <Timer className="w-3 h-3 mr-1.5" />}
      {labels[urgency]}
    </span>
  );
};

const TATStatCard = ({ title, count, icon: Icon, colorClass, bgClass, borderClass, subText }: any) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow`}>
    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderClass}`}></div>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{title}</p>
        <h3 className={`text-4xl font-bold mt-2 ${colorClass}`}>{count}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass} bg-opacity-10`}>
        <Icon size={24} />
      </div>
    </div>
    <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
      {subText}
    </p>
  </div>
);
