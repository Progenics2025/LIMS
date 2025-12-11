import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, FilePlus, Eye, X, AlertTriangle, Timer } from "lucide-react";
import type { ReportWithSample } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReportManagement() {
  // Helper: remove common honorifics from a name to avoid duplicated prefixes
  const stripHonorific = (name?: string) => {
    if (!name) return '';
    return name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?|Miss\.?|Drs\.?)(\s+|-)?/i, '').trim();
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: reports = [], isLoading } = useQuery<ReportWithSample[]>({
    queryKey: ['/api/reports'],
  });

  // TAT Logic
  const processedReports = useMemo(() => {
    return reports.map(report => {
      const regDate = new Date(report.sample?.lead?.sampleReceivedDate || report.sample?.lead?.leadCreated || new Date());
      const tatHours = (parseInt(report.sample?.lead?.tat || '0', 10) || 0) * 24;
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

  const filteredReports = processedReports.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'critical') return ['overdue', 'critical'].includes(r.urgency);
    if (filter === 'warning') return r.urgency === 'warning';
    return true;
  });

  const approveReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('PUT', `/api/reports/${reportId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Report approved",
        description: "Report has been approved and can be delivered",
      });
    },
  });

  const getStatusCounts = () => {
    return {
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      awaitingApproval: reports.filter(r => r.status === 'awaiting_approval').length,
      approved: reports.filter(r => r.status === 'approved').length,
      delivered: reports.filter(r => r.status === 'delivered').length,
    };
  };

  const statusCounts = getStatusCounts();

  const statusCards = [
    {
      title: "In Progress",
      value: statusCounts.inProgress,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Awaiting Approval",
      value: statusCounts.awaitingApproval,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Approved",
      value: statusCounts.approved,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Delivered",
      value: statusCounts.delivered,
      icon: FilePlus,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      awaiting_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return variants[status as keyof typeof variants] || variants.in_progress;
  };

  const getStatusText = (status: string) => {
    const texts = {
      in_progress: "In Progress",
      awaiting_approval: "Awaiting Approval",
      approved: "Approved",
      delivered: "Delivered",
    };
    return texts[status as keyof typeof texts] || status;
  };

  // Helper Component for TAT Urgency
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Generate, approve, and deliver client reports
        </p>
      </div>

      {/* Report Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <div className={`inline-flex p-3 rounded-lg ${card.bgColor} mb-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Report Queue</CardTitle>
            <div className="flex bg-slate-100/80 p-1 rounded-xl">
              {['all', 'critical', 'warning'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                    filter === f 
                    ? 'bg-white text-[#0085CA] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => window.open('/wes-report.html', '_blank')}>
              <FileText className="mr-2 h-4 w-4" />
              WES Report
            </Button>
            <Button>
              <FilePlus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Urgency</TableHead>
                    <TableHead className="min-w-[150px]">Sample ID</TableHead>
                    <TableHead className="min-w-[200px]">Client</TableHead>
                    <TableHead className="min-w-[180px]">Location</TableHead>
                    <TableHead className="min-w-[200px]">Test Type</TableHead>
                    <TableHead className="min-w-[120px]">Sample Type</TableHead>
                    <TableHead className="min-w-[100px]">Category</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">TAT</TableHead>
                    <TableHead className="min-w-[200px]">Contact Info</TableHead>
                    <TableHead className="min-w-[120px]">Generated Date</TableHead>
                    <TableHead className="min-w-[120px]">Delivered Date</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="min-w-[150px]">
                        <UrgencyBadge urgency={report.urgency} diffHrs={report.diffHrs} />
                      </TableCell>
                      <TableCell className="min-w-[150px] font-medium text-gray-900 dark:text-white">
                        {report.sampleId}
                      </TableCell>
                      <TableCell className="min-w-[200px] text-gray-900 dark:text-white">
                        {report.sample.lead.organisationHospital}
                      </TableCell>
                      <TableCell className="min-w-[180px] text-gray-900 dark:text-white">
                        {report.sample.lead.organisationHospital}
                      </TableCell>
                      <TableCell className="min-w-[200px] text-gray-900 dark:text-white">
                        {report.sample.lead.serviceName}
                      </TableCell>
                      <TableCell className="min-w-[120px] text-gray-900 dark:text-white">
                        {report.sample.lead.sampleType}
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge className={report.sample.lead.leadType === 'clinical_trial' || report.sample.lead.leadType === 'r_and_d' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {report.sample.lead.leadType ? report.sample.lead.leadType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Individual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Badge className={getStatusBadge(report.status || 'in_progress')}>
                          {getStatusText(report.status || 'in_progress')}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[80px] text-gray-900 dark:text-white">
                        {report.sample.lead.tat} days
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white font-medium">
                            {stripHonorific(report.sample.lead.clinicianResearcherName || '')}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            📞 {report.sample.lead.clinicianResearcherPhone || '-'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            ✉️ {report.sample.lead.clinicianResearcherEmail || '-'}
                          </div>
                          {report.sample.lead.patientClientEmail && (
                            <div className="text-gray-500 dark:text-gray-400">
                              👤 {report.sample.lead.patientClientEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px] text-gray-900 dark:text-white">
                        {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="min-w-[120px] text-gray-900 dark:text-white">
                        {report.deliveredAt ? new Date(report.deliveredAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status === 'awaiting_approval' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveReportMutation.mutate(report.id)}
                                disabled={approveReportMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button variant="destructive" size="sm">
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
