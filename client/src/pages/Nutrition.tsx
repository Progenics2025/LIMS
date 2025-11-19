import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search, Trash2, Edit } from "lucide-react";
import { useRecycle } from '@/contexts/RecycleContext';
import { toast } from "@/hooks/use-toast";

async function apiRequest(method: string, url: string, data?: any) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = new Error('API request failed');
    try {
      const errorData = await response.json();
      (error as any).body = errorData;
      (error as any).status = response.status;
      (error as any).message = errorData.message || response.statusText;
    } catch {
      (error as any).message = response.statusText;
      (error as any).status = response.status;
    }
    throw error;
  }

  return response;
}

interface NutritionRecord {
  id: string;
  title: string;
  projectId: string;
  serviceName: string;
  clientName: string;
  progenicsTrf: string;
  questionnaire: string;
  callRecordings: string;
  reportRequiredDate: string | null;
  nutritionChart: string;
  nutritionChartSharedDate: string | null;
  progenicsReports: string;
  counsellingDate: string | null;
  queries: string;
  counsellingSession: string;
  furtherCounsellingRequired: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  createdAt: string;
  updatedAt: string;
}

export default function Nutrition() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<NutritionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { add } = useRecycle();

  // Fetch nutrition records
  const { data: records = [], isLoading } = useQuery<NutritionRecord[]>({
    queryKey: ['/api/nutrition-sheet'],
    queryFn: async () => {
      const r = await fetch('/api/nutrition-sheet');
      if (!r.ok) throw new Error('Failed to fetch nutrition records');
      return r.json();
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<NutritionRecord>) => {
  const response = await apiRequest('POST', '/api/nutrition-sheet', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-sheet'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Nutrition record created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create nutrition record", 
        variant: "destructive" 
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NutritionRecord> }) => {
  const response = await apiRequest('PUT', `/api/nutrition-sheet/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-sheet'] });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      toast({ title: "Success", description: "Nutrition record updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update nutrition record", 
        variant: "destructive" 
      });
    },
  });

  // Filter records based on search query
  const filteredRecords = records.filter((record) => {
    const searchStr = searchQuery.toLowerCase();
    return (
      record.title.toLowerCase().includes(searchStr) ||
      record.projectId.toLowerCase().includes(searchStr) ||
      record.clientName.toLowerCase().includes(searchStr) ||
      record.serviceName.toLowerCase().includes(searchStr)
    );
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
      case 'on_hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutrition Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage nutrition counselling sessions and reports
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add New Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Nutrition Record</DialogTitle>
              <DialogDescription>Add a new nutrition counselling record</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: Partial<NutritionRecord> = {
                title: formData.get('title') as string,
                projectId: formData.get('projectId') as string,
                serviceName: formData.get('serviceName') as string,
                clientName: formData.get('clientName') as string,
                progenicsTrf: formData.get('progenicsTrf') as string,
                questionnaire: formData.get('questionnaire') as string,
                callRecordings: formData.get('callRecordings') as string,
                reportRequiredDate: formData.get('reportRequiredDate') as string,
                nutritionChart: formData.get('nutritionChart') as string,
                nutritionChartSharedDate: formData.get('nutritionChartSharedDate') as string,
                progenicsReports: formData.get('progenicsReports') as string,
                counsellingDate: formData.get('counsellingDate') as string,
                queries: formData.get('queries') as string,
                counsellingSession: formData.get('counsellingSession') as string,
                furtherCounsellingRequired: formData.get('furtherCounsellingRequired') === 'true',
                status: formData.get('status') as NutritionRecord['status'],
              };
              createMutation.mutate(data);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input id="projectId" name="projectId" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name</Label>
                  <Input id="serviceName" name="serviceName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input id="clientName" name="clientName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progenicsTrf">Progenics TRF</Label>
                  <Input id="progenicsTrf" name="progenicsTrf" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionnaire">Questionnaire</Label>
                  <Input id="questionnaire" name="questionnaire" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callRecordings">Call Recordings</Label>
                  <Input id="callRecordings" name="callRecordings" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportRequiredDate">Report Required Date</Label>
                  <Input id="reportRequiredDate" name="reportRequiredDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nutritionChart">Nutrition Chart</Label>
                  <Input id="nutritionChart" name="nutritionChart" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nutritionChartSharedDate">Date of Nutrition Chart Shared</Label>
                  <Input id="nutritionChartSharedDate" name="nutritionChartSharedDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progenicsReports">Progenics Reports</Label>
                  <Input id="progenicsReports" name="progenicsReports" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="counsellingDate">Date of Counselling Done</Label>
                  <Input id="counsellingDate" name="counsellingDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="queries">Any Queries</Label>
                  <Input id="queries" name="queries" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="counsellingSession">Counselling Session</Label>
                  <Input id="counsellingSession" name="counsellingSession" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="furtherCounsellingRequired">Further Counselling Required</Label>
                  <Select name="furtherCounsellingRequired" defaultValue="false">
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Record"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search by title, project ID, or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Records table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">Unique ID</th>
                <th className="px-4 py-3 text-left">Project ID</th>
                <th className="px-4 py-3 text-left">Service Name</th>
                <th className="px-4 py-3 text-left">Client Name</th>
                <th className="px-4 py-3 text-left">Progenics TRF</th>
                <th className="px-4 py-3 text-left">Questionnaire</th>
                <th className="px-4 py-3 text-left">Call Recordings / Questionnaire</th>
                <th className="px-4 py-3 text-left">Data analysis sheet</th>
                <th className="px-4 py-3 text-left">Progenics reports</th>
                <th className="px-4 py-3 text-left">Nutrition chart</th>
                <th className="px-4 py-3 text-left">Date of nutrition chart shared</th>
                <th className="px-4 py-3 text-left">Counselling session</th>
                <th className="px-4 py-3 text-left">Further Counselling required</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Remark/Comment</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">{record.id}</td>
                  <td className="px-4 py-3">{record.projectId}</td>
                  <td className="px-4 py-3">{record.serviceName}</td>
                  <td className="px-4 py-3">{record.clientName}</td>
                  <td className="px-4 py-3">{record.progenicsTrf || '-'}</td>
                  <td className="px-4 py-3">{record.questionnaire ? <FileText className="h-4 w-4 text-blue-500" /> : '-'}</td>
                  <td className="px-4 py-3">{record.callRecordings ? <FileText className="h-4 w-4 text-blue-500" /> : '-'}</td>
                  <td className="px-4 py-3">{record.progenicsReports ? <FileText className="h-4 w-4 text-blue-500" /> : '-'}</td>
                  <td className="px-4 py-3">{record.progenicsReports || '-'}</td>
                  <td className="px-4 py-3">{record.nutritionChart || '-'}</td>
                  <td className="px-4 py-3">{record.nutritionChartSharedDate ? new Date(record.nutritionChartSharedDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">{record.counsellingSession || '-'}</td>
                  <td className="px-4 py-3">{record.furtherCounsellingRequired ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusBadgeColor(record.status)}>
                      {record.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{record.queries || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-2 rounded-lg flex items-center justify-center"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsEditDialogOpen(true);
                        }}
                        aria-label="Edit Card"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!confirm('Move this nutrition record to Recycle Bin?')) return;
                          try {
                            const now = new Date();
                            const deletedAt = now.toISOString();
                            add({
                              entityType: 'nutrition',
                              entityId: record.id,
                              name: `${record.title || record.clientName || record.id}`,
                              originalPath: '/nutrition',
                              data: { ...record, deletedAt },
                              deletedAt,
                            }).catch(() => { /* ignore */ });
                          } catch (err) {
                            // ignore recycle failures
                          }

                          (async () => {
                            try {
                              const res = await fetch(`/api/nutrition-sheet/${record.id}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error('Delete failed');
                              queryClient.invalidateQueries({ queryKey: ['/api/nutrition-sheet'] });
                              toast({ title: 'Moved to Recycle', description: 'Nutrition record moved to recycle bin' });
                              // Notify recycle UI to pick up the new entry created by the server
                              window.dispatchEvent(new Event('ll:recycle:update'));
                              return;
                            } catch (e) {
                              toast({ title: 'Recycle saved locally', description: 'Server delete failed; record kept locally', variant: 'destructive' });
                            }
                          })();
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                    No nutrition records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Nutrition Record</DialogTitle>
            <DialogDescription>Modify existing nutrition record details</DialogDescription>
          </DialogHeader>
          {/* Add edit form here */}
        </DialogContent>
      </Dialog>
    </div>
  );
}