import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, FilePlus, Eye, X } from "lucide-react";
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

  const { data: reports = [], isLoading } = useQuery<ReportWithSample[]>({
    queryKey: ['/api/reports'],
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
          <CardTitle>Report Queue</CardTitle>
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
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="min-w-[150px] font-medium text-gray-900 dark:text-white">
                        {report.sample.sampleId}
                      </TableCell>
                      <TableCell className="min-w-[200px] text-gray-900 dark:text-white">
                        {report.sample.lead.organization}
                      </TableCell>
                      <TableCell className="min-w-[180px] text-gray-900 dark:text-white">
                        {report.sample.lead.location}
                      </TableCell>
                      <TableCell className="min-w-[200px] text-gray-900 dark:text-white">
                        {report.sample.lead.testName}
                      </TableCell>
                      <TableCell className="min-w-[120px] text-gray-900 dark:text-white">
                        {report.sample.lead.sampleType}
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge className={report.sample.lead.category === 'clinical' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                          {report.sample.lead.category ? report.sample.lead.category.charAt(0).toUpperCase() + report.sample.lead.category.slice(1) : 'Clinical'}
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
                            Dr. {stripHonorific(report.sample.lead.referredDoctor)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            📞 {report.sample.lead.phone}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            ✉️ {report.sample.lead.email}
                          </div>
                          {report.sample.lead.clientEmail && (
                            <div className="text-gray-500 dark:text-gray-400">
                              👤 {report.sample.lead.clientEmail}
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
