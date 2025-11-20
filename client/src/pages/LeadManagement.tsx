import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput, formatINR } from "@/components/ui/currency-input";
import { Plus, Edit, CheckCircle, Trash2, UserPlus, Flame, List } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRecycle } from '@/contexts/RecycleContext';
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/phone-input.css';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { insertLeadSchema, type Lead, type LeadWithUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateRoleId } from "@/lib/generateRoleId";
import { z } from "zod";

const leadFormSchema = insertLeadSchema.extend({
  // Required Organization fields
  organization: z.string()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters")
    .max(255, "Organization name must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Organization name cannot be just whitespace"),
    
  location: z.string()
    .min(1, "Location is required")
    .min(2, "Location must be at least 2 characters")
    .max(255, "Location must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Location cannot be just whitespace"),
  clinicianAddress: z.string().optional(),
    
  // Required Doctor fields
  referredDoctor: z.string()
    .min(1, "Clinical name/Referred doctor is required")
    .min(2, "Doctor name must be at least 2 characters")
    .max(255, "Doctor name must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Doctor name cannot be just whitespace"),
    
  // Email validation with proper format
  email: z.string()
    .min(1, "Doctor's email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),
    
  // Phone validation for international numbers (required)
  phone: z.string()
    .min(1, "Doctor's phone number is required")
    .refine((phone) => {
      if (!phone || phone.trim() === '') return false; // Make required
      return isValidPhoneNumber(phone);
    }, {
      message: "Please enter a valid international phone number"
    }),
    
  // Lead type validation
  leadTypeDiscovery: z.string()
    .min(1, "Lead type is required")
    .max(100, "Lead type must not exceed 100 characters"),
    
  // Test details validation
  testName: z.string()
    .min(1, "Test name is required")
    .min(2, "Test name must be at least 2 characters")
    .max(255, "Test name must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Test name cannot be just whitespace"),
    
  sampleType: z.string()
    .min(1, "Sample type is required")
    .min(2, "Sample type must be at least 2 characters")
    .max(255, "Sample type must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Sample type cannot be just whitespace"),
    
  // Amount validation with proper format
  amountQuoted: z.string()
    .min(1, "Amount quoted is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a valid positive number")
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 999999999.99;
    }, "Amount cannot exceed 999,999,999.99"),
    
  // Patient details validation
  patientClientName: z.string()
    .min(1, "Patient name is required")
    .min(2, "Patient name must be at least 2 characters")
    .max(255, "Patient name must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Patient name cannot be just whitespace"),
    
  patientClientPhone: z.string()
    .min(1, "Patient's phone number is required")
    .refine((phone) => {
      if (!phone || phone.trim() === '') return false; // Make required
      return isValidPhoneNumber(phone);
    }, {
      message: "Please enter a valid international phone number"
    }),
  sampleId: z.string().optional(),
  patientAddress: z.string().optional(),
    
  // Additional fields for lead management
  specialty: z.string().optional(),
  geneticCounsellorRequired: z.boolean().optional(),
  nutritionRequired: z.boolean().optional(),
  serviceName: z.string().optional(),
  leadType: z.string().optional(),
  discoveryStatus: z.string().optional(),
  followUp: z.string().optional(),
  budget: z.string().optional(),
  salesResponsiblePerson: z.string().optional(),
  noOfSamples: z.coerce.number().int().positive().optional().nullable(),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  gender: z.enum(['Male','Female','Other']).optional(),
  patientClientEmail: z.string().email().optional().or(z.literal("")),
  // Tracking / pickup fields
  pickupFrom: z.string().optional(),
  // date inputs (YYYY-MM-DD)
  dateSampleCollected: z.string().optional().nullable(),
  // store the datetime-local value (YYYY-MM-DDTHH:mm) as a string in the form
  // and convert to Date in coerceNumericFields before submission
  pickupUpto: z.string().optional().nullable(),
  // date when sample was shipped
  sampleShippedDate: z.string().optional().nullable(),
  shippingAmount: z.string().optional(),
  trackingId: z.string().optional(),
  courierCompany: z.string().optional(),
  progenicsTRF: z.string().optional(),
  phlebotomistCharges: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

// Helper: convert string inputs that represent numbers into actual numbers
function coerceNumericFields(data: Partial<LeadFormData> | LeadFormData) {
  const copy: any = { ...data };

  const toDecimalString = (v: any) => {
    if (v === undefined || v === null || v === '') return null;
    // If already a string, keep as-is (assume it's a decimal string)
    if (typeof v === 'string') return v;
    // If number, convert to string with no loss of precision
    if (typeof v === 'number') return v.toString();
    const asNum = Number(v);
    return Number.isFinite(asNum) ? String(asNum) : null;
  };

  // Convert pickupUpto from ISO string to Date object
  if (copy.pickupUpto && typeof copy.pickupUpto === 'string' && copy.pickupUpto.trim() !== '') {
    try {
      const d = new Date(copy.pickupUpto);
      // If valid, store as ISO string (server normalizer will convert to Date)
      if (!isNaN(d.getTime())) {
        copy.pickupUpto = d.toISOString();
      } else {
        copy.pickupUpto = null;
      }
    } catch (error) {
      copy.pickupUpto = null;
    }
  } else {
    copy.pickupUpto = null;
  }

  // Convert dateSampleCollected (YYYY-MM-DD) to Date
  if (copy.dateSampleCollected && typeof copy.dateSampleCollected === 'string' && copy.dateSampleCollected.trim() !== '') {
    try {
      // date input returns YYYY-MM-DD - parse as local midnight then send ISO
      const d = new Date(copy.dateSampleCollected + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        copy.dateSampleCollected = d.toISOString();
      } else {
        copy.dateSampleCollected = null;
      }
    } catch (e) {
      copy.dateSampleCollected = null;
    }
  } else {
    copy.dateSampleCollected = null;
  }

  // Convert sampleShippedDate (YYYY-MM-DD) to Date
  if (copy.sampleShippedDate && typeof copy.sampleShippedDate === 'string' && copy.sampleShippedDate.trim() !== '') {
    try {
      const d = new Date(copy.sampleShippedDate + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        copy.sampleShippedDate = d.toISOString();
      } else {
        copy.sampleShippedDate = null;
      }
    } catch (e) {
      copy.sampleShippedDate = null;
    }
  } else {
    copy.sampleShippedDate = null;
  }

  // Some server-side schema uses `dateSampleReceived` (DB column `date_sample_received`)
  // If client sent sampleShippedDate, copy it to dateSampleReceived so the
  // insert/update payload matches the server insert schema and persists to DB.
  if ((copy as any).sampleShippedDate && !(copy as any).dateSampleReceived) {
    (copy as any).dateSampleReceived = (copy as any).sampleShippedDate;
  }

  // Decimal fields (drizzle decimal => zod string) must be sent as strings
  copy.amountQuoted = toDecimalString(copy.amountQuoted);
  copy.budget = toDecimalString(copy.budget);
  copy.shippingAmount = toDecimalString(copy.shippingAmount);
  copy.phlebotomistCharges = toDecimalString(copy.phlebotomistCharges);

  // Integer fields - ensure they are numbers (Zod coerce will handle, but double-check)
  if (copy.noOfSamples !== undefined && copy.noOfSamples !== null && copy.noOfSamples !== '') {
    copy.noOfSamples = typeof copy.noOfSamples === 'number' ? copy.noOfSamples : parseInt(copy.noOfSamples, 10);
  } else {
    copy.noOfSamples = null;
  }

  if (copy.age !== undefined && copy.age !== null && copy.age !== '') {
    copy.age = typeof copy.age === 'number' ? copy.age : parseInt(copy.age, 10);
  } else {
    copy.age = null;
  }

  // tat may be registered with valueAsNumber; ensure it's an integer or null
  if (copy.tat !== undefined && copy.tat !== null && copy.tat !== '') {
    copy.tat = typeof copy.tat === 'number' ? copy.tat : parseInt(copy.tat, 10);
  }

  // If createdBy is present, keep as-is
  return copy as Partial<LeadFormData> & Record<string, any>;
}

// Normalize a lead record coming from the API/database to the camelCase shape
// the UI expects. This supports both snake_case (DB) and camelCase (API) inputs.
function normalizeLead(l: any) {
  if (!l) return l;
  const get = (snake: string, camel: string) => {
    if (l[camel] !== undefined) return l[camel];
    if (l[snake] !== undefined) return l[snake];
    return undefined;
  };

  const normalized: any = {
    // identity
    id: get('id', 'id'),
    // project / unique identifiers
    projectId: get('project_id', 'projectId') || get('projectId', 'projectId') || get('project', 'projectId') || undefined,
    uniqueId: get('unique_id', 'uniqueId') || get('uniqueId', 'uniqueId') || undefined,
    // sample/test
    // sampleId should map to the DB/sample human-readable identifier (sample_id)
    // Prefer an explicit samples.sample_id if a nested `sample` object is present
    sampleId:
      get('sample_id', 'sampleId') ??
      get('sampleId', 'sampleId') ??
      (l.sample ? (l.sample.sampleId ?? l.sample.sample_id) : undefined) ??
      undefined,
    testName: (() => {
      const testName = get('test_name', 'testName') ?? get('testName', 'testName');
      const serviceName = get('service_name', 'serviceName') ?? get('serviceName', 'serviceName');

      // If testName is a placeholder or empty, try to use serviceName as fallback
      if (!testName || (typeof testName === 'string' && (testName === 'Unknown Test' || testName.toLowerCase().includes('unknown')))) {
        if (serviceName && typeof serviceName === 'string' && serviceName !== 'Unknown' && !serviceName.toLowerCase().includes('unknown')) {
          return serviceName;
        }
        return testName || undefined;
      }
      return testName;
    })(),
    // dates
    // Accept multiple DB keys: `date_sample_collected`, `sample_collected_date`, or camelCase variants
    dateSampleCollected: get('date_sample_collected', 'dateSampleCollected') || get('sample_collected_date', 'dateSampleCollected') || get('dateSampleCollected', 'dateSampleCollected') || null,
    // Accept `created` (some DBs use `created`) as well as `created_at`/camelCase
    createdAt: get('created', 'createdAt') || get('created_at', 'createdAt') || get('createdAt', 'createdAt') || null,
    // Modified maps to converted_at per mapping (also keep updatedAt/backwards compat)
    convertedAt: get('converted_at', 'convertedAt') || get('convertedAt', 'convertedAt') || null,
    updatedAt: get('converted_at', 'updatedAt') || get('updatedAt', 'updatedAt') || get('converted_at', 'converted_at') || null,
    // lead/organisation fields
    leadType: get('lead_type_discovery', 'leadType') || get('leadType', 'leadType') || get('lead_type_discovery', 'lead_type_discovery') || undefined,
    // Normalize backend status values: treat legacy `completed` as `converted` so
    // the UI and filters remain consistent.
    status: ((): any => {
      const s = get('status', 'status');
      if (s === undefined || s === null) return undefined;
      if (String(s).toLowerCase() === 'completed') return 'converted';
      return String(s);
    })(),
    geneticCounsellorRequired: get('genetic_counsellor_required', 'geneticCounsellorRequired') ?? get('geneticCounsellorRequired', 'geneticCounsellorRequired') ?? false,
    // Nutrition / diet management flags may be present under several names
    nutritionRequired: get('nutrition_management', 'nutritionRequired') || get('nutrition_required', 'nutritionRequired') || get('nutritionRequired', 'nutritionRequired') || get('nutritionManagement', 'nutritionRequired') || false,
    createdBy: get('created_by', 'createdBy') || get('createdBy', 'createdBy') || undefined,
    salesResponsiblePerson: get('sales_responsible_person', 'salesResponsiblePerson') || get('salesResponsiblePerson', 'salesResponsiblePerson') || undefined,
    sampleType: get('sample_type', 'sampleType') || undefined,
    // Map organization from a variety of backend keys so the UI shows the org/hospital
    organization:
      get('organization', 'organization') ||
      get('organisation', 'organization') ||
      get('org', 'organization') ||
      get('hospital', 'organization') ||
      get('hospital_name', 'organization') ||
      get('clinic_name', 'organization') ||
      // As a last resort, some exports put the hospital/org under `organisation_hospital`
      get('organisation_hospital', 'organization') ||
      undefined,
    // clinician / referred doctor may be stored under multiple names
    referredDoctor: get('clinician_name', 'referredDoctor') || get('clinician_researcher_name', 'referredDoctor') || get('referredDoctor', 'referredDoctor') || get('referred_doctor', 'referred_doctor') || undefined,
    clinicHospitalName: get('clinic_hospital_name', 'clinicHospitalName') || undefined,
    // Accept both US and British spellings from backend: `specialty` and `speciality`
    specialty: get('specialty', 'specialty') || get('speciality', 'specialty') || undefined,
    // clinician emails / phones may use alternate column names
    email: get('clinician_org_email', 'email') || get('clinician_researcher_email', 'email') || get('email', 'email') || undefined,
    phone: get('clinician_org_phone', 'phone') || get('clinician_researcher_contact', 'phone') || get('phone', 'phone') || undefined,
    // Location may be named `location`; keep organization name as separate field
    location: get('location', 'location') || get('organization', 'location') || undefined,
    // patient fields
    patientClientName: get('patient_client_name', 'patientClientName') || undefined,
    patientClientEmail: get('patient_client_email', 'patientClientEmail') || undefined,
    patientClientPhone:
      get('patient_client_phone', 'patientClientPhone') ||
      get('patient_client_contact', 'patientClientPhone') ||
      get('patient_client_contact_no', 'patientClientPhone') ||
      get('patient_contact', 'patientClientPhone') ||
      get('patient_contact_number', 'patientClientPhone') ||
      get('patient_phone', 'patientClientPhone') ||
      get('patient_phone_number', 'patientClientPhone') ||
      get('patientClientPhone', 'patientClientPhone') ||
      undefined,
    patientAddress: get('patient_address', 'patientAddress') || undefined,
    noOfSamples: get('no_of_samples', 'noOfSamples') ?? get('noOfSamples', 'noOfSamples') ?? undefined,
    age: get('age', 'age') ?? undefined,
    gender: get('gender', 'gender') || undefined,
    budget: get('budget', 'budget') ?? undefined,
    serviceName: get('service_name', 'serviceName') || undefined,
    followUp: get('follow_up', 'followUp') || undefined,
    pickupFrom:
      get('pickup_from', 'pickupFrom') ||
      get('sample_pickup_from', 'pickupFrom') ||
      get('pickup_location', 'pickupFrom') ||
      get('collection_point', 'pickupFrom') ||
      undefined,
    pickupUpto:
      get('pickup_upto', 'pickupUpto') ||
      get('delivery_upto', 'pickupUpto') ||
      get('deliveryUpto', 'pickupUpto') ||
      get('pickupUpto', 'pickupUpto') ||
      undefined,
    // sample shipped/date received may be returned under several names depending
    // on whether the value comes from the `samples` table (sample_shipped_date)
    // or from the `leads` table (date_sample_received / dateSampleReceived).
    // Map shipped and received explicitly so UI columns can pick the correct one.
    sampleShippedDate:
      get('sample_shipped_date', 'sampleShippedDate') ||
      get('sampleShippedDate', 'sampleShippedDate') ||
      get('date_sample_shipped', 'sampleShippedDate') ||
      undefined,
    // sampleReceivedDate: explicit mapping for date_sample_received and variants
    sampleReceivedDate:
      get('sample_received_date', 'sampleReceivedDate') ||
      get('date_sample_received', 'sampleReceivedDate') ||
      get('dateSampleReceived', 'sampleReceivedDate') ||
      undefined,
    // clinician / researcher address (various backend names)
    clinicianAddress:
      get('clinician_address', 'clinicianAddress') ||
      get('clinic_hospital_address', 'clinicianAddress') ||
      get('clinic_address', 'clinicianAddress') ||
      get('clinician_org_address', 'clinicianAddress') ||
      // Some exports place the hospital/organisation under `organisation_hospital` - use it as clinician address
      get('organisation_hospital', 'clinicianAddress') ||
      undefined,
    shippingAmount:
      get('shipping_amount', 'shippingAmount') ??
      get('sample_shipment_amount', 'shippingAmount') ??
      get('shipment_amount', 'shippingAmount') ??
      get('courier_charges', 'shippingAmount') ??
      get('courier_charge', 'shippingAmount') ??
      undefined,
    trackingId: get('tracking_id', 'trackingId') || undefined,
    courierCompany: get('courier_company', 'courierCompany') || undefined,
    progenicsTRF: get('progenics_trf', 'progenicsTRF') || get('progenicsTRF', 'progenicsTRF') || undefined,
    phlebotomistCharges: get('phlebotomist_charges', 'phlebotomistCharges') ?? undefined,
    // pricing / misc
    amountQuoted: get('amount_quoted', 'amountQuoted') ?? get('amountQuoted', 'amountQuoted') ?? undefined,
    tat: get('tat', 'tat') ?? undefined,
    // keep raw original for debugging if needed
    _raw: l,
  };

  return normalized;
}

export default function LeadManagement() {
  // Helper: remove common honorifics from a name to avoid duplicated prefixes
  const stripHonorific = (name?: string) => {
    if (!name) return '';
    return name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?|Miss\.?|Drs\.?)(\s+|-)?/i, '').trim();
  };
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('clinical');
  const [editSelectedCategory, setEditSelectedCategory] = useState<string>('clinical');
  const [selectedLeadType, setSelectedLeadType] = useState<string>('individual');
  const [editSelectedLeadType, setEditSelectedLeadType] = useState<string>('individual');
  const [customSampleType, setCustomSampleType] = useState<string>('');
  const [showCustomSampleType, setShowCustomSampleType] = useState<boolean>(false);
  const [showCustomServiceName, setShowCustomServiceName] = useState<boolean>(false);
  const [selectedTrfFile, setSelectedTrfFile] = useState<File | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('Dr');
  const [clinicianName, setClinicianName] = useState<string>('');
  const [editSelectedTitle, setEditSelectedTitle] = useState<string>('Dr');
  const [editClinicianName, setEditClinicianName] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // All fields in Lead Management Add & Edit modals are editable per user instruction

  // Role-based permissions helper
  const canCreate = () => ['admin', 'manager', 'sales'].includes((user?.role || '').toLowerCase());
  const canEdit = (lead: any) => {
    const userRole = (user?.role || '').toLowerCase();
    // Admin and Manager can edit all leads
    if (['admin', 'manager'].includes(userRole)) return true;
    // Sales can edit leads they created
    if (userRole === 'sales' && lead?.createdBy === user?.id) return true;
    return false;
  };
  const canDelete = () => ['admin', 'manager'].includes((user?.role || '').toLowerCase());
  const canView = () => true; // All authenticated users can view
  
  // Filter leads based on user role
  const filterLeadsByRole = (allLeads: any[]) => {
    const userRole = (user?.role || '').toLowerCase();
    if (['admin', 'manager'].includes(userRole)) return allLeads; // Show all leads
    if (userRole === 'sales') return allLeads; // Sales see all but can only edit own (UI restricts this)
    // Other roles see only their own leads
    return allLeads.filter(l => l.createdBy === user?.id);
  };

  const { data: leads = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/leads'],
  });

  // Project samples (new integration)
  const { data: projectSamples = [] } = useQuery<any[]>({ queryKey: ['/api/project-samples'] });

  // Normalize incoming leads to consistent camelCase shape
  const leadSource = (Array.isArray(projectSamples) && projectSamples.length > 0) ? projectSamples : leads;
  const normalizedLeads = Array.isArray(leadSource) ? leadSource.map(normalizeLead) : [];

  // Client-side search & pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  // use a non-empty value for the Select; Radix Select does not accept empty-string items
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Apply role-based filtering first
  const roleFilteredLeads = filterLeadsByRole(normalizedLeads);

  // Derived filtered leads (apply role filter + search + status)
  const filteredLeads = roleFilteredLeads.filter((l) => {
    // if statusFilter is 'all' or falsy, don't filter by status
    if (statusFilter && statusFilter !== 'all' && String(l.status) !== String(statusFilter)) return false;
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      (String(l.organization || '')).toLowerCase().includes(s) ||
      // allow searching by sample id as well
      (String(l.sampleId || '')).toLowerCase().includes(s) ||
      (String(l.referredDoctor || '')).toLowerCase().includes(s) ||
      (String(l.email || '')).toLowerCase().includes(s) ||
      (String(l.phone || '')).toLowerCase().includes(s)
    );
  });

  const totalFiltered = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;
  // Apply sorting
  const sortedLeads = (() => {
    if (!sortKey) return filteredLeads;
    const copy = [...filteredLeads];
    copy.sort((a: any, b: any) => {
      const A = a[sortKey];
      const B = b[sortKey];
      if (A == null && B == null) return 0;
      if (A == null) return sortDir === 'asc' ? -1 : 1;
      if (B == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof A === 'number' && typeof B === 'number') return sortDir === 'asc' ? A - B : B - A;
      const sA = String(A).toLowerCase();
      const sB = String(B).toLowerCase();
      if (sA < sB) return sortDir === 'asc' ? -1 : 1;
      if (sA > sB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  })();
  const visibleLeads = sortedLeads.slice(start, start + pageSize);

  const createLeadMutation = useMutation<any, any, LeadFormData>({
    mutationFn: async (data: LeadFormData) => {
      const leadData = { ...coerceNumericFields(data), createdBy: user?.id } as Record<string, any>;
      // Generate unique ID if not provided by the form
      try {
        if (!leadData.uniqueId && !leadData.unique_id) {
          const roleForId = (user && (user as any).role) || (data as any).leadType || 'admin';
          const uid = generateRoleId(String(roleForId));
          leadData.uniqueId = uid;
          leadData.unique_id = uid;
        }
      } catch (e) {
        // Non-fatal: warn and continue without blocking create
        // eslint-disable-next-line no-console
        console.warn('[LeadManagement] generateRoleId failed', e);
      }

      // Debug: log payload so browser console shows what is being sent
      // (helps trace UI wiring issues)
      // eslint-disable-next-line no-console
      console.debug('[LeadManagement] createLead payload:', leadData);
      const response = await apiRequest('POST', '/api/project-samples', leadData);
      return response.json();
    },
    onSuccess: async (createdLead: any, variables?: LeadFormData) => {
      queryClient.invalidateQueries({ queryKey: ['/api/project-samples'] });
      // Invalidate dashboard stats when lead is created
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      setIsCreateDialogOpen(false);
      // Reset title and name states
      setSelectedTitle('Dr');
      setClinicianName('');
      // If a TRF file was selected, upload it to DB and associate with lead
      (async () => {
        try {
          // Need to refetch created lead (latest) to find its id - simplistic approach: refetch list and pick the newest
          const created = createdLead;
          if (selectedTrfFile && created && created.id) {
            const fd = new FormData();
            fd.append('trf', selectedTrfFile);
            fd.append('leadId', created.id);
            const up = await fetch('/api/uploads/trf-db', { method: 'POST', body: fd });
            if (up.ok) {
              const body = await up.json();
              // body contains { id }
              const trfUrl = `/api/uploads/trf/${body.id}`;
              // update lead to set progenicsTRF
              await fetch(`/api/leads/${created.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progenicsTRF: trfUrl }) });
            }
          }
        } catch (err) {
          console.error('Post-create TRF upload failed', err);
        }
      })();
      setSelectedTrfFile(null);
      form.reset();
      toast({ title: "Lead created", description: "New lead has been successfully created" });
      // If the form requested genetic counselling, create the GC record so it
      // appears directly in the Genetic Counselling component.
      try {
        const requestedGc = !!variables?.geneticCounsellorRequired;
        if (requestedGc && createdLead) {
          const sampleId = createdLead.id || createdLead.sampleId || createdLead._id || null;
          if (sampleId) {
            const payload = { sample_id: sampleId, gc_name: '', approval_status: 'pending' };
            const resp = await apiRequest('POST', '/api/gc-registration', payload);
            let body: any = null;
            try { body = await resp.json(); } catch (e) { /* ignore */ }
            if (resp.ok) {
              queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
              queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
              toast({ title: 'Genetic counselling created', description: 'Record created for this lead' });
            } else {
              const msg = body?.message || body?.error || 'Failed to create genetic counselling record';
              toast({ title: 'Genetic counselling error', description: msg, variant: 'destructive' });
            }
          }
        }
      } catch (err: any) {
        // Non-fatal: log and notify
        // eslint-disable-next-line no-console
        console.error('[LeadManagement] create GC on create error:', err);
        try {
          toast({ title: 'Genetic counselling error', description: (err && err.message) || String(err), variant: 'destructive' });
        } catch {}
      }
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-console
      console.error('[LeadManagement] createLead error:', error);
      // If server returned structured field errors, set them on the form
      if (error && error.body && error.body.fields) {
        const fields = error.body.fields as Record<string, string[]>;
        Object.entries(fields).forEach(([k, messages]) => {
          form.setError(k as any, { type: 'server', message: messages.join(', ') });
        });
      }
      toast({ title: "Error creating lead", description: error.message, variant: "destructive" });
    },
  });

  // To test creating a lead with all fields via curl, example:
  // curl -X POST http://localhost:5173/api/leads \
  //  -H "Content-Type: application/json" \
  //  -d '{"organization":"Test Org","location":"City","referredDoctor":"Dr Test","email":"doc@example.com","phone":"+919876543210","specialty":"Genetics","serviceName":"Genomics","leadType":"individual","testName":"gutgenics","sampleType":"blood","amountQuoted":"1000","tat":7,"status":"quoted","salesResponsiblePerson":"Sales Person","dateSampleCollected":"2025-10-03","followUp":"Call weekly","pickupFrom":"Clinic Address","pickupUpto":"2025-10-05T15:30","sampleShippedDate":"2025-10-04","shippingAmount":"50.00","trackingId":"TRK123","courierCompany":"DHL","progenicsTRF":"trf-ref","phlebotomistCharges":"200.00"}'


  const updateLeadMutation = useMutation<any, any, { id: string; data: Partial<LeadFormData> }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadFormData> }) => {
      const leadDataRaw = { ...coerceNumericFields(data as LeadFormData) } as Record<string, any>;
      // Remove null/empty-string fields for update requests so the server's
      // partial schema validation doesn't fail on explicit nulls for fields
      // that the client didn't intend to update (notably date fields).
      const leadData: Record<string, any> = {};
      Object.entries(leadDataRaw).forEach(([k, v]) => {
        if (v === undefined) return;
        // Treat empty string and explicit null as "not provided" for updates
        if (v === null) return;
        if (typeof v === 'string' && v.trim() === '') return;
        leadData[k] = v;
      });
      // eslint-disable-next-line no-console
      console.debug('[LeadManagement] updateLead payload:', { id, leadData });
      const response = await apiRequest('PUT', `/api/leads/${id}`, leadData);
      return response.json();
    },
    onSuccess: async (updatedLead: any, variables?: { id: string; data: Partial<LeadFormData> }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      // Invalidate dashboard stats when lead is updated
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      setIsEditDialogOpen(false);
      setSelectedLead(null);
      editForm.reset();
      toast({ title: "Lead updated", description: "Lead has been successfully updated" });

      // If Genetic Counsellor is required after edit, ensure a GC record exists
      try {
        const requestedGc = !!variables?.data?.geneticCounsellorRequired;
        if (requestedGc) {
          const leadOrSampleId = updatedLead?.id || variables?.id;
          if (leadOrSampleId) {
            // Check for existing GC record for this lead/sample id to avoid duplicates
            let exists = false;
            try {
              const res = await fetch('/api/gc-registration', { credentials: 'include' });
              if (res.ok) {
                const list = await res.json();
                exists = Array.isArray(list) && list.some((r: any) => {
                  const sid = r?.sampleId ?? r?.sample_id;
                  return String(sid || '') === String(leadOrSampleId);
                });
              }
            } catch (e) {
              // non-fatal; assume not exists and attempt create
            }

            if (!exists) {
              const payload = { sample_id: leadOrSampleId, gc_name: '', approval_status: 'pending' };
              const resp = await apiRequest('POST', '/api/gc-registration', payload);
              let body: any = null;
              try { body = await resp.json(); } catch {}
              if (resp.ok) {
                queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
                toast({ title: 'Genetic counselling created', description: 'Record created for this lead' });
              } else {
                const msg = body?.message || body?.error || 'Failed to create genetic counselling record';
                toast({ title: 'Genetic counselling error', description: msg, variant: 'destructive' });
              }
            }
          }
        }
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('[LeadManagement] create GC on edit error:', err);
      }
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-console
      console.error('[LeadManagement] updateLead error:', error);
      if (error && error.body && error.body.fields) {
        const fields = error.body.fields as Record<string, string[]>;
        Object.entries(fields).forEach(([k, messages]) => {
          editForm.setError(k as any, { type: 'server', message: messages.join(', ') });
        });
      }
      toast({ title: "Error updating lead", description: error.message, variant: "destructive" });
    },
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/leads/${id}/status`, { status });
      if (!response.ok) throw new Error('Failed to update lead status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({ title: "Status updated", description: "Lead status has been updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // eslint-disable-next-line no-console
      console.debug('[LeadManagement] deleteLead id:', id);
      const response = await apiRequest('DELETE', `/api/leads/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      // Invalidate dashboard stats when lead is deleted
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      toast({ title: 'Lead deleted', description: 'Lead has been removed' });
      // Ensure recycle UI refreshes immediately (server creates the recycle snapshot)
      window.dispatchEvent(new Event('ll:recycle:update'));
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-console
      console.error('[LeadManagement] deleteLead error:', error);
      toast({ title: 'Error deleting lead', description: error?.message || String(error), variant: 'destructive' });
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async ({ id, sampleData }: { id: string; sampleData: any }) => {
      const response = await apiRequest('POST', `/api/leads/${id}/convert`, sampleData);
      let body: any = null;
      try { body = await response.json(); } catch (e) { /* ignore parse errors */ }
      if (!response.ok) {
        const msg = body?.message || body?.error || 'Failed to convert lead';
        throw new Error(msg);
      }
      return body;
    },
    onSuccess: (data) => {
      // Refresh leads and samples so Sample Tracking shows the new sample
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      // Invalidate dashboard stats when lead is converted
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      // Also refresh lab processing, finance and bioinformatics endpoints so
      // those components immediately reflect the newly-created records
      queryClient.invalidateQueries({ queryKey: ['/api/lab-processing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bioinformatics'] });
      toast({ 
        title: "Lead converted",
        description: `Lead converted to sample ${data?.sample?.sampleId || '(no id returned)'}`
      });
      // Attempt to reconcile/create downstream records (best-effort).
      (async () => {
        try {
          await reconcileConvertedLead(data);
        } catch (e) {
          // Non-fatal: log and notify a warning so operator can investigate
          // eslint-disable-next-line no-console
          console.warn('[LeadManagement] downstream reconcile failed', e);
          try { toast({ title: 'Partial sync', description: 'Some downstream systems could not be updated automatically' }); } catch (e) {}
        }
      })();
    },
    onError: (error: any) => {
      toast({ title: "Error converting lead", description: error?.message || String(error), variant: "destructive" });
    },
  });
  
  // Attempt to reconcile converted lead into other modules (best-effort).
  async function reconcileConvertedLead(convertResponse: any) {
    // convertResponse may contain a `lead` and/or `sample` object depending on API
    const sample = convertResponse?.sample || convertResponse?.createdSample || null;
    const lead = convertResponse?.lead || null;
    const id = sample?.id || sample?.sampleId || lead?.id || lead?.leadId || lead?.id || null;

    // If we have no id at all, nothing to reconcile
    if (!id) return;

    // Helper: try POSTing to an endpoint and swallow non-fatal errors
    const tryPost = async (url: string, payload: any) => {
      try {
        const res = await apiRequest('POST', url, payload);
        if (res.ok) return await res.json();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[LeadManagement] reconcile POST failed', url, e);
      }
      return null;
    };

    // Build a minimal payload using fields available from convertResponse
    const common = {
      leadId: lead?.id || lead?.leadId || null,
      sampleId: sample?.sampleId || sample?.id || null,
      organization: lead?.organization || lead?._raw?.organization || null,
      referredDoctor: lead?.referredDoctor || lead?._raw?.referred_doctor || null,
      patientName: lead?.patientClientName || lead?._raw?.patient_client_name || null,
    };

    // Process Master: create/process a workflow entry
    await tryPost('/api/process-master', { ...common, action: 'create_from_conversion' });

    // Genetic Counselling: ensure GC record exists
    await tryPost('/api/gc-registration', { sample_id: common.sampleId || common.leadId, approval_status: 'pending' });

    // Sample Tracking: create sample record if API supports it
    await tryPost('/api/samples', { sampleId: common.sampleId, leadId: common.leadId, source: 'conversion' });

    // Finance: create finance record placeholder
    await tryPost('/api/finance/records', { sampleId: common.sampleId, amount: sample?.amount || lead?.amountQuoted || null, status: 'pending' });

    // Lab Processing: create lab processing entry
    await tryPost('/api/lab-processing', { sampleId: common.sampleId, status: 'queued' });

    // Bioinformatics: create placeholder record
    await tryPost('/api/bioinformatics', { sampleId: common.sampleId, status: 'queued' });

    // Nutrition: create nutrition referral if requested
    if (lead?.nutritionRequired || lead?._raw?.nutrition_required) {
      await tryPost('/api/nutrition/referrals', { sampleId: common.sampleId, leadId: common.leadId, status: 'pending' });
    }

    // Finally, invalidate queries so UI shows created items
    queryClient.invalidateQueries({ queryKey: ['/api/process-master'] });
    queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
    queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
    queryClient.invalidateQueries({ queryKey: ['/api/finance/records'] });
    queryClient.invalidateQueries({ queryKey: ['/api/lab-processing'] });
    queryClient.invalidateQueries({ queryKey: ['/api/bioinformatics'] });
    queryClient.invalidateQueries({ queryKey: ['/api/nutrition/referrals'] });
  }
  // NOTE: createGcMutation removed. Genetic counselling records requested at
  // lead creation (Genetic Counsellor Required = Yes) are created automatically
  // in createLeadMutation.onSuccess so they appear directly in the Genetic Counselling page.

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onBlur', // Trigger validation when user leaves a field
    reValidateMode: 'onChange', // Re-validate on every change after first validation
    defaultValues: {
    organization: '',
    location: '',
    clinicianAddress: '',
      referredDoctor: '',
      phone: '',
      email: '',
      clientEmail: '',
      testName: '',
      sampleType: '',
      category: 'clinical',
      amountQuoted: "",
      tat: 14,
      status: 'quoted',
      specialty: '',
      serviceName: '',
      leadType: 'individual',
      discoveryStatus: '',
      followUp: '',
      budget: '',
      salesResponsiblePerson: '',
      noOfSamples: undefined,
      patientClientName: '',
      age: undefined,
      sampleId: '',
      sampleShippedDate: '',
      gender: 'Male',
      patientClientPhone: '',
      patientClientEmail: '',
  patientAddress: '',
      // date fields
      dateSampleCollected: '',
      // tracking defaults
      pickupFrom: '',
      pickupUpto: '',
      shippingAmount: '',
      trackingId: '',
      courierCompany: '',
      progenicsTRF: '',
      phlebotomistCharges: '',
      nutritionRequired: false,
    },
  });

  const editForm = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onBlur', // Trigger validation when user leaves a field
    reValidateMode: 'onChange', // Re-validate on every change after first validation
    defaultValues: {
    organization: '',
    location: '',
    clinicianAddress: '',
      referredDoctor: '',
      phone: '',
      email: '',
      clientEmail: '',
      testName: '',
      sampleType: '',
      category: 'clinical',
      amountQuoted: "",
      tat: 14,
      status: 'quoted',
      specialty: '',
      serviceName: '',
      leadType: 'individual',
      discoveryStatus: '',
      followUp: '',
      budget: '',
      salesResponsiblePerson: '',
      noOfSamples: undefined,
      patientClientName: '',
      age: undefined,
      gender: 'Male',
      patientClientPhone: '',
      patientClientEmail: '',
  patientAddress: '',
      // date fields
      dateSampleCollected: '',
      // tracking defaults
      pickupFrom: '',
      pickupUpto: '',
      shippingAmount: '',
      trackingId: '',
      courierCompany: '',
      progenicsTRF: '',
      phlebotomistCharges: '',
      nutritionRequired: false,
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    try {
      if (selectedLead) {
        await updateLeadMutation.mutateAsync({ id: selectedLead.id, data });
      } else {
        await createLeadMutation.mutateAsync(data);
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[LeadManagement] submit error', e);
      try {
        toast({ title: 'Error', description: e?.message || 'Failed to save lead', variant: 'destructive' });
      } catch (err) {
        // ignore toast failures
      }
    }
  };

  const onEditSubmit = (data: LeadFormData) => {
    if (!selectedLead) return;
    updateLeadMutation.mutate({ id: selectedLead.id, data });
  };

  const { add } = useRecycle();

  const handleEditLead = (lead: Lead) => {
    // lead may be normalized already; ensure UI selectedLead holds raw id
    setSelectedLead(lead as any);
    setEditSelectedCategory((lead as any).category || 'clinical');
    setEditSelectedLeadType((lead as any).leadType || 'individual');

    // Parse referredDoctor into title and name for edit state
    const referredDoctor = (lead as any).referredDoctor || '';
    const nameParts = referredDoctor.split(' ');
    const titlePrefixes = ['Dr', 'Mr', 'Ms', 'Prof'];
    if (titlePrefixes.includes(nameParts[0]) && nameParts.length > 1) {
      setEditSelectedTitle(nameParts[0]);
      setEditClinicianName(nameParts.slice(1).join(' '));
    } else {
      setEditSelectedTitle('Dr');
      setEditClinicianName(referredDoctor);
    }

    // Populate form with normalized lead data
    editForm.reset({
      organization: (lead as any).organization || '',
      location: (lead as any).location || '',
      referredDoctor: (lead as any).referredDoctor || '',
      clinicHospitalName: (lead as any).clinicHospitalName || '',
      clinicianAddress: (lead as any).clinicianAddress || '',
      phone: (lead as any).phone || '',
      email: (lead as any).email || '',
      clientEmail: (lead as any).clientEmail || (lead as any).patientClientEmail || '',
      testName: (lead as any).testName || '',
      sampleType: (lead as any).sampleType || '',
      category: (lead as any).category || 'clinical',
      amountQuoted: (lead as any).amountQuoted != null ? String((lead as any).amountQuoted) : '',
      tat: (lead as any).tat || 14,
      status: (lead as any).status || 'quoted',
      specialty: (lead as any).specialty || '',
      serviceName: (lead as any).serviceName || '',
      leadType: (lead as any).leadType || 'individual',
      discoveryStatus: (lead as any).discoveryStatus || '',
      followUp: (lead as any).followUp || '',
      budget: (lead as any).budget != null ? String((lead as any).budget) : '',
      salesResponsiblePerson: (lead as any).salesResponsiblePerson || '',
      noOfSamples: (lead as any).noOfSamples || undefined,
      patientClientName: (lead as any).patientClientName || '',
      age: (lead as any).age || undefined,
  patientAddress: (lead as any).patientAddress || '',
      gender: (lead as any).gender || 'Male',
      patientClientPhone: (lead as any).patientClientPhone || '',
      patientClientEmail: (lead as any).patientClientEmail || '',
      // date fields
      dateSampleCollected: (lead as any).dateSampleCollected ? new Date((lead as any).dateSampleCollected).toISOString().slice(0,10) : '',
      // tracking fields - convert Date to ISO string for datetime-local input
      pickupFrom: (lead as any).pickupFrom || '',
      pickupUpto: (lead as any).pickupUpto ? new Date((lead as any).pickupUpto).toISOString().slice(0,16) : '',
      sampleShippedDate: (lead as any).sampleShippedDate ? new Date((lead as any).sampleShippedDate).toISOString().slice(0,10) : '',
      shippingAmount: (lead as any).shippingAmount != null ? String((lead as any).shippingAmount) : '',
      trackingId: (lead as any).trackingId || '',
      courierCompany: (lead as any).courierCompany || '',
      progenicsTRF: (lead as any).progenicsTRF || '',
      phlebotomistCharges: (lead as any).phlebotomistCharges != null ? String((lead as any).phlebotomistCharges) : '',
      nutritionRequired: (lead as any).nutritionRequired != null ? !!(lead as any).nutritionRequired : false,
    });
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateLeadStatusMutation.mutate({ id: leadId, status: newStatus });
  };

  const handleConvertLead = (leadId: string) => {
  const lead = normalizedLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    if (lead.status !== 'won') {
      toast({ 
        title: "Cannot convert lead", 
        description: "Lead must be in 'won' status before conversion", 
        variant: "destructive" 
      });
      return;
    }
    
    const sampleData: any = {
      amount: lead.amountQuoted,
      status: 'pickup_scheduled'
    };

    // If this is a WES lead and genetic counsellor is required, request GC creation on convert
    try {
      const svc = (lead.serviceName || '').toString().toLowerCase();
      if (svc.includes('wes') && !!lead.geneticCounsellorRequired) {
        sampleData.createGeneticCounselling = true;
      }
    } catch (e) {
      // ignore errors and proceed with default conversion behavior
    }
    
    convertLeadMutation.mutate({ id: leadId, sampleData });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'quoted': return 'bg-gray-100 text-gray-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      case 'hot': return 'bg-orange-100 text-orange-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'quoted': return 'cold';
      case 'cold': return 'hot';
      case 'hot': return 'won';
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Simplified lead management for individual tests (Gutgenics, AMR Profile, Molecular) and project-based leads
          </p>
        </div>
        
        {/* Create Lead Dialog - Only visible to Admin, Manager, Sales */}
        {canCreate() && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add New Lead</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>Create leads for individual tests or projects with common organization details</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Common Organization Fields - Always shown */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Organization / Hospital  <span className="text-red-500">*</span></Label>
                    <Input {...form.register('organization')} placeholder="Hospital/Clinic Name" />
                    {form.formState.errors.organization && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.organization.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Clinician  / Researcher Name <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedTitle}
                        onValueChange={(value) => {
                          setSelectedTitle(value);
                          form.setValue('referredDoctor', `${value} ${stripHonorific(clinicianName)}`.trim());
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr">Dr</SelectItem>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={clinicianName}
                        onChange={(e) => {
                          setClinicianName(e.target.value);
                          form.setValue('referredDoctor', `${selectedTitle} ${stripHonorific(e.target.value)}`.trim());
                        }}
                        placeholder="Name"
                        className="flex-1"
                      />
                    </div>
                    {form.formState.errors.referredDoctor && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.referredDoctor.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Clinician / Researcher Email <span className="text-red-500">*</span></Label>
                    <Input {...form.register('email')} placeholder="doctor@hospital.com" />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Clinician / Researcher Phone <span className="text-red-500">*</span></Label>
                    <div className="phone-input-wrapper">
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="IN"
                        value={form.watch('phone') || ''}
                        onChange={(value) => form.setValue('phone', value || '')}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Clinician / Researcher Address</Label>
                    <Input {...form.register('clinicianAddress')} placeholder="Clinic / Hospital address" />
                  </div>
                  <div>
                    <Label>Specialty</Label>
                    <Input {...form.register('specialty')} placeholder="Genetics, Oncology, etc." />
                  </div>
                  <div>
                    <Label>Service Name</Label>
                    <Select onValueChange={(value) => {
                      if (value === 'other') {
                        setShowCustomServiceName(true);
                        form.setValue('serviceName', '');
                      } else {
                        setShowCustomServiceName(false);
                        form.setValue('serviceName', value);
                      }
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
      <SelectItem value="WES">WES</SelectItem>
                          <SelectItem value="CMA">CMA</SelectItem>
                          <SelectItem value="MLPA">MLPA</SelectItem>
                          <SelectItem value="NBS">NBS</SelectItem>
                          <SelectItem value="Karyotyping">Karyotyping</SelectItem>
                          <SelectItem value="Wellgenics">Wellgenics</SelectItem>
                          <SelectItem value="Sanger">Sanger Sequencing - Clinical</SelectItem>
                          <SelectItem value="Sanger">Sanger Sequencing - Discovery</SelectItem>
                          <SelectItem value="Gut Genics">Gut Genics</SelectItem>
                          <SelectItem value="WGS">Whole Genome Sequencing</SelectItem>
                          <SelectItem value="Targeted Amplicons">Targeted Amplicons Sequencing</SelectItem>
                          <SelectItem value="Shotgun">Shotgun Metagenomics Sequencing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomServiceName && (
                      <Input className="mt-2" placeholder="Enter service name" onChange={(e) => form.setValue('serviceName', e.target.value)} />
                    )}
                  </div>
                </div>
              </div>

              {/* Lead Type Selection */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Lead Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Lead Type <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(value) => { 
                      form.setValue('leadTypeDiscovery', value); 
                      setSelectedLeadType(value); 
                    }} defaultValue="individual">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Test</SelectItem>
                        <SelectItem value="project">Project/Bulk Testing</SelectItem>
                        <SelectItem value="clinical_trial">Clinical Trial</SelectItem>
                        <SelectItem value="r_and_d">R&D</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.leadTypeDiscovery && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.leadTypeDiscovery.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Test Category</Label>
                    <Select
                      onValueChange={(value) => {
                        // value is either 'clinical' or 'discovery'
                        form.setValue('category', value);

                        // Auto-generate or update sampleId prefix
                        try {
                          const current = form.getValues('sampleId') || '';
                          const prefix = value === 'clinical' ? 'PG' : 'DG';

                          const hasCorrectPrefix = current && (current.startsWith(prefix) || current.startsWith(prefix + '-'));
                          if (!current || !hasCorrectPrefix) {
                            // generate a short unique suffix
                            const suffix = Math.floor(100000 + Math.random() * 900000).toString();
                            form.setValue('sampleId', `${prefix}-${suffix}`);
                          } else if (current) {
                            // current has some prefix, replace it with the new one but keep suffix if present
                            const parts = current.split('-');
                            if (parts.length > 1) {
                              parts[0] = prefix;
                              form.setValue('sampleId', parts.join('-'));
                            } else {
                              // no suffix, generate one
                              const suffix = Math.floor(100000 + Math.random() * 900000).toString();
                              form.setValue('sampleId', `${prefix}-${suffix}`);
                            }
                          }
                        } catch (e) {
                          // ignore
                        }
                      }}
                      defaultValue={form.getValues('category') || 'clinical'}
                    >
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clinical">Clinical</SelectItem>
                        <SelectItem value="discovery">Discovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lead Status</Label>
                    <Select onValueChange={(value) => form.setValue('status', value)} defaultValue={form.getValues('status') || 'quoted'}>
                      <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lead Created By</Label>
                    <Input value={user?.name || String(user?.id || '')} disabled />
                  </div>
                    <div>
                      <Label>Budget (INR)</Label>
                      <Input {...form.register('budget')} type="number" step="0.01" placeholder="e.g., 10000" />
                    </div>
        
                  <div>
                    <Label>Sample Type <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(value) => {
                      if (value === 'custom') {
                        setShowCustomSampleType(true);
                        form.setValue('sampleType', '');
                      } else {
                        setShowCustomSampleType(false);
                        form.setValue('sampleType', value);
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select Sample Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blood">Blood</SelectItem>
                        <SelectItem value="soil">Soil</SelectItem>
                        <SelectItem value="saliva">Saliva</SelectItem>
                        <SelectItem value="stool">Stool</SelectItem>
                        <SelectItem value="tissue">Tissue</SelectItem>
                        <SelectItem value="urine">Urine</SelectItem>
                        <SelectItem value="custom">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomSampleType && (
                      <Input className="mt-2" placeholder="Enter sample type" 
                             onChange={(e) => form.setValue('sampleType', e.target.value)} />
                    )}
                    {form.formState.errors.sampleType && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.sampleType.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Amount Quoted (INR) <span className="text-red-500">*</span></Label>
                    <CurrencyInput
                      value={parseFloat(form.watch('amountQuoted')) || 0}
                      onValueChange={(value) => form.setValue('amountQuoted', (value || 0).toString())}
                    />
                    {form.formState.errors.amountQuoted && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.amountQuoted.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>TAT (Days)</Label>
                    <Input {...form.register('tat', { valueAsNumber: true })} type="number" placeholder="14" />
                  </div>
                  <div>
                    <Label>Sales / Responsible Person</Label>
                    <Select onValueChange={(value) => form.setValue('salesResponsiblePerson', value)} defaultValue={form.getValues('salesResponsiblePerson') || ''}>
                      <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shiva">SHIVA KUMAR Y M</SelectItem>
                        <SelectItem value="Srikanth">Vakumulu Srikanth</SelectItem>
                        <SelectItem value="Aruna Priya">Dr. Y Aruna Priya</SelectItem>
                        <SelectItem value="Krishna">Dr Krishnasai Reddy</SelectItem>
                        <SelectItem value="Karthik">S Karthik Iyer</SelectItem>
                        <SelectItem value="Swapnil">Dr. Swapnil Chandrakant Kajale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Genetic Counsellor Required</Label>
                    <Select onValueChange={(value) => form.setValue('geneticCounsellorRequired', value === 'yes')} defaultValue={form.getValues('geneticCounsellorRequired') ? 'yes' : 'no'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nutrition Counsellor Required </Label>
                    <Select onValueChange={(value) => form.setValue('nutritionRequired', value === 'yes')} defaultValue={form.getValues('nutritionRequired') ? 'yes' : 'no'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Project-specific fields - only for project type */}
              {selectedLeadType === 'project' && (
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium mb-4">Project Details</h3>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                      📊 Additional details for project/bulk testing leads
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Project Budget (INR)</Label>
                      <Input {...form.register('budget')} placeholder="500000" />
                    </div>
                    <div>
                      <Label>Expected No. of Samples</Label>
                      <Input {...form.register('noOfSamples', { valueAsNumber: true })} type="number" placeholder="50" />
                    </div>
                    <div>
                      <Label>Follow-up Schedule</Label>
                      <Input {...form.register('followUp')} placeholder="Weekly updates" />
                    </div>
                    <div>
                      <Label>Project Contact Name</Label>
                      <Input {...form.register('patientClientName')} placeholder="Project Lead" />
                    </div>
                    <div>
                      <Label>Project Contact Phone</Label>
                      <div className="phone-input-wrapper">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="IN"
                          value={form.watch('patientClientPhone') || ''}
                          onChange={(value) => form.setValue('patientClientPhone', value || '')}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {form.formState.errors.patientClientPhone && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.patientClientPhone.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Project Contact Email</Label>
                      <Input {...form.register('patientClientEmail')} placeholder="project@org.com" />
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Details Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Patient Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Sample Collected Date</Label>
                    <Input type="date" {...form.register('dateSampleCollected')} />
                  </div>
                  <div>
                    <Label>Sample Shipped Date</Label>
                    <Input type="date" {...form.register('sampleShippedDate')} />
                  </div>
                  {/* Patient-specific fields (avoid duplicates of organization/lead-level controls) */}
                  <div>
                    <Label>Patient / Client Name <span className="text-red-500">*</span></Label>
                    <Input {...form.register('patientClientName')} placeholder="Patient full name" />
                    {form.formState.errors.patientClientName && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.patientClientName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Patient / Client Email</Label>
                    <Input {...form.register('patientClientEmail')} placeholder="patient@example.com" />
                  </div>
                  <div>
                    <Label>Patient / Client Address</Label>
                    <Input {...form.register('patientAddress')} placeholder="Patient address" />
                  </div>
                  <div>
                    <Label>Patient / Client Phone<span className="text-red-500">*</span></Label>
                    <div className="phone-input-wrapper">
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="IN"
                        value={form.watch('patientClientPhone') || ''}
                        onChange={(value) => form.setValue('patientClientPhone', value || '')}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {form.formState.errors.patientClientPhone && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.patientClientPhone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input {...form.register('age', { valueAsNumber: true })} type="number" placeholder="e.g., 35" />
                  </div>
                   <div>
                    <Label>No of Samples</Label>
                      <Input {...form.register('noOfSamples', { valueAsNumber: true })} type="number" placeholder="e.g., 20" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select onValueChange={(v) => form.setValue('gender', v as 'Male' | 'Female' | 'Other')} defaultValue={form.getValues('gender') || 'Male'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                    {/* (duplicates removed) */}
                  </div>
              </div>

              {/* Tracking / Pickup Details */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Tracking & Pickup Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Follow Up</Label>
                    <Input {...form.register('followUp')} placeholder="Follow up notes / schedule" />
                  </div>
                  <div>
                    <Label> Sample Pickup From (Address)</Label>
                    <Input {...form.register('pickupFrom')} placeholder="Pickup address" />
                  </div>
                  <div>
                    <Label>Pickup Upto (deadline)</Label>
                    <Input 
                      {...form.register('pickupUpto')} 
                      type="datetime-local" 
                      min={form.watch('dateSampleCollected') ? `${form.watch('dateSampleCollected')}T00:00` : undefined}
                      onChange={(e) => {
                        // Keep the datetime-local value format (YYYY-MM-DDTHH:mm)
                        // so edits and initial values remain consistent. The
                        // coerceNumericFields will convert the string to a Date
                        // object before submission.
                        if (e.target.value) {
                          const sampleDate = form.watch('dateSampleCollected');
                          if (sampleDate) {
                            const pickupDate = new Date(e.target.value);
                            const collectionDate = new Date(sampleDate);
                            if (pickupDate < collectionDate) {
                              // If pickup date is before sample collection date, set it to sample collection date
                              form.setValue('pickupUpto', `${sampleDate}T00:00`);
                              return;
                            }
                          }
                          form.setValue('pickupUpto', e.target.value);
                        } else {
                          form.setValue('pickupUpto', '');
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label>Sample Shipping Amount (INR)</Label>
                    <Input {...form.register('shippingAmount')} type="number" step="0.01" placeholder="e.g., 500" />
                  </div>
                  <div>
                    <Label>Tracking ID</Label>
                    <Input {...form.register('trackingId')} placeholder="Courier tracking number" />
                  </div>
                  <div>
                    <Label>Courier Company</Label>
                    <Input {...form.register('courierCompany')} placeholder="DHL, BlueDart, etc." />
                  </div>
                  <div>
                    <Label>Progenics TRF</Label>
                    <div className="flex items-center space-x-2">
                      <Input {...form.register('progenicsTRF')} placeholder="TRF reference" />
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          setSelectedTrfFile(f);
                          // optionally show the filename in the progenicsTRF input
                          form.setValue('progenicsTRF', f.name);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Phlebotomist Charges (INR)</Label>
                    <Input {...form.register('phlebotomistCharges')} type="number" step="0.01" placeholder="e.g., 200" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedTitle('Dr');
                  setClinicianName('');
                  form.reset();
                }}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={createLeadMutation.isPending}
                
                >
                  {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}

        {/* Edit Lead Dialog - Only visible to users who can edit this lead */}
        {isEditDialogOpen && selectedLead && canEdit(selectedLead) && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>Edit existing lead details. Changes will be saved to the server.</DialogDescription>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium mb-4">Organization Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Organization / Hospital *</Label>
                      <Input {...editForm.register('organization')} placeholder="Hospital/Clinic Name" />
                      {editForm.formState.errors.organization && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.organization.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Name <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                        <Select
                          value={editSelectedTitle}
                          onValueChange={(value) => {
                            setEditSelectedTitle(value);
                            editForm.setValue('referredDoctor', `${value} ${stripHonorific(editClinicianName)}`.trim());
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Title" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dr">Dr</SelectItem>
                            <SelectItem value="Mr">Mr</SelectItem>
                            <SelectItem value="Ms">Ms</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={editClinicianName}
                          onChange={(e) => {
                            setEditClinicianName(e.target.value);
                            editForm.setValue('referredDoctor', `${editSelectedTitle} ${stripHonorific(e.target.value)}`.trim());
                          }}
                          placeholder="Name"
                          className="flex-1"
                        />
                      </div>
                      {editForm.formState.errors.referredDoctor && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.referredDoctor.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Email <span className="text-red-500">*</span></Label>
                      <Input {...editForm.register('email')} placeholder="doctor@hospital.com" />
                      {editForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Phone <span className="text-red-500">*</span></Label>
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="IN"
                        value={editForm.watch('phone') || ''}
                        onChange={(value) => editForm.setValue('phone', value || '')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter phone number"
                      />
                      {editForm.formState.errors.phone && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Address</Label>
                      <Input {...editForm.register('clinicianAddress')} placeholder="Clinic / Hospital address" defaultValue={editForm.getValues('clinicianAddress')} />
                    </div>
                    <div>
                      <Label>Specialty</Label>
                      <Input {...editForm.register('specialty')} placeholder="Genetics, Oncology, etc." />
                    </div>
                    <div>
                      <Label>Service Name</Label>
                      <Select
                        onValueChange={(value) => {
                          if (value === 'other') {
                            setShowCustomServiceName(true);
                            editForm.setValue('serviceName', '');
                          } else {
                            setShowCustomServiceName(false);
                            editForm.setValue('serviceName', value);
                          }
                        }}
                        value={editForm.getValues('serviceName') || ''}
                        defaultValue={editForm.getValues('serviceName') || ''}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WES">WES</SelectItem>
                          <SelectItem value="CMA">CMA</SelectItem>
                          <SelectItem value="MLPA">MLPA</SelectItem>
                          <SelectItem value="NBS">NBS</SelectItem>
                          <SelectItem value="Karyotyping">Karyotyping</SelectItem>
                          <SelectItem value="Wellgenics">Wellgenics</SelectItem>
                          <SelectItem value="Sanger">Sanger Sequencing - Clinical</SelectItem>
                          <SelectItem value="Sanger">Sanger Sequencing - Discovery</SelectItem>
                          <SelectItem value="Gut Genics">Gut Genics</SelectItem>
                          <SelectItem value="WGS">Whole Genome Sequencing</SelectItem>
                          <SelectItem value="Targeted Amplicons">Targeted Amplicons Sequencing</SelectItem>
                          <SelectItem value="Shotgun">Shotgun Metagenomics Sequencing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {showCustomServiceName && (
                        <Input className="mt-2" placeholder="Enter service name" onChange={(e) => editForm.setValue('serviceName', e.target.value)} defaultValue={editForm.getValues('serviceName') || ''} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium mb-4">Lead Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Lead Type *</Label>
                        <Select onValueChange={(value) => { editForm.setValue('leadTypeDiscovery', value); setEditSelectedLeadType(value); }} defaultValue={editSelectedLeadType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual Test</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                        {editForm.formState.errors.leadTypeDiscovery && (
                          <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.leadTypeDiscovery.message}</p>
                        )}
                      </div>
                      <div>
                        <Label>Budget (INR)</Label>
                        <Input {...editForm.register('budget')} type="number" step="0.01" placeholder="e.g., 10000" />
                      </div>
                      <div>
                        <Label>Sample Type *</Label>
                        <Select onValueChange={(value) => {
                          if (value === 'custom') {
                            setShowCustomSampleType(true);
                            editForm.setValue('sampleType', '');
                          } else {
                            setShowCustomSampleType(false);
                            editForm.setValue('sampleType', value);
                          }
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select Sample Type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blood">Blood</SelectItem>
                            <SelectItem value="saliva">Saliva</SelectItem>
                            <SelectItem value="stool">Stool</SelectItem>
                            <SelectItem value="tissue">Tissue</SelectItem>
                            <SelectItem value="urine">Urine</SelectItem>
                            <SelectItem value="soil">Soil</SelectItem>
                            <SelectItem value="custom">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {showCustomSampleType && (
                          <Input className="mt-2" placeholder="Enter sample type" onChange={(e) => editForm.setValue('sampleType', e.target.value)} />
                        )}
                        {editForm.formState.errors.sampleType && (
                          <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.sampleType.message}</p>
                        )}
                      </div>
                    <div>
                      <Label>Test Category</Label>
                      <Select onValueChange={(value) => { editForm.setValue('category', value); setEditSelectedCategory(value); }} defaultValue={editSelectedCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clinical">Clinical</SelectItem>
                          <SelectItem value="discovery">Discovery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount Quoted *</Label>
                      <CurrencyInput value={editForm.watch('amountQuoted') as any} onValueChange={(v: any) => editForm.setValue('amountQuoted', v)} />
                      {editForm.formState.errors.amountQuoted && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.amountQuoted.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>TAT (days)</Label>
                      <Input type="number" {...editForm.register('tat', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select onValueChange={(value) => editForm.setValue('status', value)} defaultValue={editForm.watch('status') || 'quoted'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quoted">Quoted</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="hot">Hot</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sales / Responsible Person</Label>
                      <Select onValueChange={(value) => editForm.setValue('salesResponsiblePerson', value)} defaultValue={editForm.getValues('salesResponsiblePerson') || ''}>
                        <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Shiva">Shiva</SelectItem>
                          <SelectItem value="Srikanth">Srikanth</SelectItem>
                          <SelectItem value="Aruna Priya">Aruna Priya</SelectItem>
                          <SelectItem value="Krishna">Krishna</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Genetic Counsellor Required</Label>
                      <Select onValueChange={(value) => editForm.setValue('geneticCounsellorRequired', value === 'yes')} defaultValue={editForm.getValues('geneticCounsellorRequired') ? 'yes' : 'no'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nutrition Counsellor Required</Label>
                      <Select onValueChange={(value) => editForm.setValue('nutritionRequired', value === 'yes')} defaultValue={editForm.getValues('nutritionRequired') ? 'yes' : 'no'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Project-specific fields - only for project type (edit) */}
                {editSelectedLeadType === 'project' && (
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-medium mb-4">Project Details</h3>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-700">📊 Additional details for project/bulk testing leads</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Project Budget (INR)</Label>
                        <Input {...editForm.register('budget')} placeholder="500000" />
                      </div>
                      <div>
                        <Label>Expected No. of Samples</Label>
                        <Input {...editForm.register('noOfSamples', { valueAsNumber: true })} type="number" placeholder="50" />
                      </div>
                      <div>
                        <Label>Follow-up Schedule</Label>
                        <Input {...editForm.register('followUp')} placeholder="Weekly updates" />
                      </div>
                      <div>
                        <Label>Project Contact Name</Label>
                        <Input {...editForm.register('patientClientName')} placeholder="Project Lead" />
                      </div>
                      <div>
                        <Label>Project Contact Phone</Label>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="IN"
                          value={editForm.watch('patientClientPhone') || ''}
                          onChange={(value) => editForm.setValue('patientClientPhone', value || '')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter phone number"
                        />
                        {editForm.formState.errors.patientClientPhone && (
                          <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.patientClientPhone.message}</p>
                        )}
                      </div>
                      <div>
                        <Label>Project Contact Email</Label>
                        <Input {...editForm.register('patientClientEmail')} placeholder="project@org.com" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Patient Details Section (edit) */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium mb-4">Patient Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Sample Collected Date</Label>
                      <Input type="date" {...editForm.register('dateSampleCollected')} />
                    </div>
                     <div>
                       <Label>Sample Shipped Date</Label>
                       <Input type="date" {...editForm.register('sampleShippedDate')} />
                     </div>
                    <div>
                      <Label>Patient /Client Name *</Label>
                      <Input {...editForm.register('patientClientName')} placeholder="Patient full name" />
                      {editForm.formState.errors.patientClientName && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.patientClientName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Patient /Client Email ID</Label>
                      <Input {...editForm.register('patientClientEmail')} placeholder="patient@example.com" />
                    </div>
                    <div>
                      <Label>Patient /Client Address</Label>
                      <Input {...editForm.register('patientAddress')} placeholder="Patient address" />
                    </div>
                    <div>
                      <Label>Patient / Client Phone Number</Label>
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="IN"
                        value={editForm.watch('patientClientPhone') || ''}
                        onChange={(value) => editForm.setValue('patientClientPhone', value || '')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter phone number"
                      />
                      {editForm.formState.errors.patientClientPhone && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.patientClientPhone.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input {...editForm.register('age', { valueAsNumber: true })} type="number" placeholder="e.g., 35" />
                    </div>
                    <div>
                      <Label>No of Samples</Label>
                      <Input {...editForm.register('noOfSamples', { valueAsNumber: true })} type="number" placeholder="e.g., 20" />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select onValueChange={(v) => editForm.setValue('gender', v as 'Male' | 'Female' | 'Other')} defaultValue={editForm.getValues('gender') || 'Male'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Patient details kept minimal here; tracking/pickup fields are in the Tracking section below */}
                  </div>
                </div>

                {/* Tracking & Pickup Details */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium mb-4">Tracking & Pickup Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Follow Up</Label>
                      <Input {...editForm.register('followUp')} placeholder="Follow up notes / schedule" />
                    </div>
                    <div>
                      <Label>Pickup From (Address)</Label>
                      <Input {...editForm.register('pickupFrom')} placeholder="Pickup address" />
                    </div>
                    <div>
                      <Label>Pickup Upto (deadline)</Label>
                      <Input
                        {...editForm.register('pickupUpto')}
                        type="datetime-local"
                        min={editForm.watch('dateSampleCollected') ? `${editForm.watch('dateSampleCollected')}T00:00` : undefined}
                        onChange={(e) => {
                          if (e.target.value) {
                            const sampleDate = editForm.watch('dateSampleCollected');
                            if (sampleDate) {
                              const pickupDate = new Date(e.target.value);
                              const collectionDate = new Date(sampleDate);
                              if (pickupDate < collectionDate) {
                                // If pickup date is before sample collection date, set it to sample collection date
                                editForm.setValue('pickupUpto', `${sampleDate}T00:00`);
                                return;
                              }
                            }
                            editForm.setValue('pickupUpto', e.target.value);
                          } else {
                            editForm.setValue('pickupUpto', '');
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label>Shipping Amount (INR)</Label>
                      <Input {...editForm.register('shippingAmount')} type="number" step="0.01" placeholder="e.g., 500" />
                    </div>
                    <div>
                      <Label>Tracking ID</Label>
                      <Input {...editForm.register('trackingId')} placeholder="Courier tracking number" />
                    </div>
                    <div>
                      <Label>Courier Company</Label>
                      <Input {...editForm.register('courierCompany')} placeholder="DHL, BlueDart, etc." />
                    </div>
                    <div>
                      <Label>Progenics TRF</Label>
                      <div className="flex items-center space-x-2">
                        <Input {...editForm.register('progenicsTRF')} placeholder="TRF reference" />
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;
                            setSelectedTrfFile(f);
                            editForm.setValue('progenicsTRF', f.name);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Phlebotomist Charges (INR)</Label>
                      <Input {...editForm.register('phlebotomistCharges')} type="number" step="0.01" placeholder="e.g., 200" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" type="button" onClick={() => { setIsEditDialogOpen(false); setSelectedLead(null); }}>Cancel</Button>
                  <Button type="submit" disabled={updateLeadMutation.isPending}>{updateLeadMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Top stat tiles: Hot leads and Converted leads (compact style per reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(() => {
          const hotCount = normalizedLeads.filter((l) => String(l.status) === 'hot').length;
          const convertedCount = normalizedLeads.filter((l) => String(l.status) === 'converted' || !!l.convertedAt).length;
          const totalCount = normalizedLeads.length;
          return (
            <>
              <Card className="rounded-lg border border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Flame className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Hot leads</div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900">{hotCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg border border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                        <List className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total leads</div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900">{totalCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Converted leads</div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900">{convertedCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>

      {/* Pie chart: Leads by service name */}
      {(() => {
        const serviceCounts: Record<string, number> = normalizedLeads.reduce((acc: Record<string, number>, l: any) => {
          
          // Try multiple approaches to get the actual test/service name
          let key = null;
          
          // Approach 1: Check serviceName first
          if (l.serviceName && l.serviceName !== 'Unknown' && !l.serviceName.toLowerCase().includes('unknown')) {
            key = l.serviceName;
          }
          // Approach 2: Check testName
          else if (l.testName && l.testName !== 'Unknown Test' && l.testName !== 'Unknown' && !l.testName.toLowerCase().includes('unknown')) {
            key = l.testName;
          }
          // Approach 3: Check raw data fields
          else if (l._raw) {
            const raw = l._raw;
            key = raw.serviceName || raw.service_name || raw.testName || raw.test_name || 
                  raw.service || raw.test || raw.type || raw.testType || raw.test_type;
          }
          
          // Approach 4: Smart inference from related fields
          if (!key || key === 'Unknown Test' || key === 'Unknown') {
            // Try to infer from organization name
            const org = (l.organization || l._raw?.organization || '').toLowerCase();
            const doctor = (l.referredDoctor || l._raw?.referredDoctor || l._raw?.referred_doctor || '').toLowerCase();
            const location = (l.location || l._raw?.location || '').toLowerCase();
            const specialty = (l.specialty || l._raw?.specialty || '').toLowerCase();
            
            // Use pattern matching to infer test type
            const allText = `${org} ${doctor} ${location} ${specialty}`.toLowerCase();
            
            if (allText.includes('wes') || allText.includes('exome') || specialty.includes('genetic')) {
              key = 'WES (Whole Exome Sequencing)';
            } else if (allText.includes('genome') && !allText.includes('exome')) {
              key = 'Whole Genome Sequencing';
            } else if (allText.includes('sanger')) {
              key = 'Sanger Sequencing';
            } else if (allText.includes('karyotyp')) {
              key = 'Karyotyping';
            } else if (allText.includes('mlpa')) {
              key = 'MLPA';
            } else if (allText.includes('cma')) {
              key = 'CMA';
            } else if (allText.includes('fragile')) {
              key = 'Fragile X Syndrome Testing';
            } else if (allText.includes('nipt')) {
              key = 'NIPT';
            } else if (allText.includes('hboc')) {
              key = 'HBOC Gene Panel';
            } else if (allText.includes('rna')) {
              key = 'RNA Sequencing';
            } else if (specialty.includes('genetic') || specialty.includes('oncolog')) {
              key = 'Genetic Testing (Unspecified)';
            } else {
              // Final fallback - use a more descriptive name
              key = 'Clinical Testing (Unspecified)';
            }
          }
          
          // Clean up and standardize the key names
          if (key && key !== 'Unknown' && key !== 'Unknown Test') {
            // Convert technical names to user-friendly names
            if (key === 'gutgenics') key = 'Gutgenics';
            else if (key === 'amr-profile') key = 'AMR Profile';
            else if (key === 'molecular-testing') key = 'Molecular Testing';
            else if (key === 'wgs-clinical') key = 'Whole Genome Sequencing - Clinical';
            else if (key === 'wgs-discovery') key = 'Whole Genome Sequencing - Discovery';
            else if (key === 'rna-seq') key = 'RNA Sequencing';
            else if (key === 'exome-seq') key = 'Exome Sequencing';
            // Handle common variations with substring matching
            else if (key.toLowerCase().includes('wes') || key.toLowerCase().includes('exome')) {
              key = 'WES (Whole Exome Sequencing)';
            }
            else if (key.toLowerCase().includes('genome') && !key.toLowerCase().includes('exome')) {
              key = 'Whole Genome Sequencing';
            }
            else if (key.toLowerCase().includes('rna')) key = 'RNA Sequencing';
            else if (key.toLowerCase().includes('sanger')) key = 'Sanger Sequencing';
            else if (key.toLowerCase().includes('karyotyp')) key = 'Karyotyping';
            else if (key.toLowerCase().includes('mlpa')) key = 'MLPA';
            else if (key.toLowerCase().includes('cma')) key = 'CMA';
            else if (key.toLowerCase().includes('fragile')) key = 'Fragile X Syndrome Testing';
            else if (key.toLowerCase().includes('nipt')) key = 'NIPT';
            else if (key.toLowerCase().includes('hboc')) key = 'HBOC Gene Panel';
          }
          
          // Final fallback - should rarely happen now
          if (!key || key === 'Unknown Test' || key === 'Unknown') {
            key = 'Clinical Testing (Unspecified)';
          }
          
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

  const serviceData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  // Use a high-contrast categorical palette (D3 category10) so slices are visually distinct
  const COLORS = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];

  // Aggregate very small slices into an "Other" bucket and only label the top slices
  const MAX_LABEL_SLICES = 8;
  const totalCount = serviceData.reduce((s, d) => s + d.value, 0);
  const labeledServiceData = (() => {
    if (serviceData.length <= MAX_LABEL_SLICES) return serviceData;
    const top = serviceData.slice(0, MAX_LABEL_SLICES);
    const rest = serviceData.slice(MAX_LABEL_SLICES);
    const restSum = rest.reduce((s, d) => s + d.value, 0);
    top.push({ name: 'Other', value: restSum });
    return top;
  })();

  // Chart overlay for outside labels: measure container, compute label positions
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [overlayLabels, setOverlayLabels] = useState<any[]>([]);

  useEffect(() => {
    const compute = () => {
      if (!chartRef.current) return;
      const el = chartRef.current;
      const rect = el.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const centerX = width * 0.40; // matches cx="40%" used by the Pie
      const centerY = height * 0.50; // matches cy="50%"
      const radius = Math.min(width, height) * 0.28; // outer radius px (approx)

      const total = labeledServiceData.reduce((s: number, d: any) => s + d.value, 0) || 1;
      let acc = 0;
      const left: any[] = [];
      const right: any[] = [];

      labeledServiceData.forEach((d: any, i: number) => {
        const start = (acc / total) * 360;
        const angle = (d.value / total) * 360;
        const mid = start + angle / 2;
        acc += d.value;
        const RAD = Math.PI / 180;
        const midRad = -mid * RAD;
        const sx = centerX + radius * Math.cos(midRad);
        const sy = centerY + radius * Math.sin(midRad);

        const outerOffset = 36; // distance from slice edge to label anchor
        const lx = centerX + (radius + outerOffset) * Math.cos(midRad);
        const ly = centerY + (radius + outerOffset) * Math.sin(midRad);
        const side = lx < centerX ? 'left' : 'right';
        const color = COLORS[i % COLORS.length];
        const pct = Math.round((d.value / total) * 100);
        const labelText = d.name;

        const item = { index: i, sx, sy, lx, ly, side, color, pct, labelText };
        if (side === 'left') left.push(item); else right.push(item);
      });

      const MIN_DY = 18;
      const adjust = (arr: any[], side: 'left' | 'right') => {
        // sort by ly
        arr.sort((a, b) => a.ly - b.ly);
        // enforce min spacing top->bottom
        for (let i = 1; i < arr.length; i++) {
          const prev = arr[i - 1];
          if (arr[i].ly < prev.ly + MIN_DY) {
            arr[i].ly = prev.ly + MIN_DY;
          }
        }
        // push up if bottom overflow
        const bottomLimit = height - 8;
        const overflow = arr.length ? (arr[arr.length - 1].ly - bottomLimit) : 0;
        if (overflow > 0) {
          for (let i = arr.length - 1; i >= 0; i--) {
            arr[i].ly -= overflow;
            if (i > 0 && arr[i].ly < arr[i - 1].ly + MIN_DY) {
              arr[i - 1].ly = arr[i].ly - MIN_DY;
            }
          }
        }
        // ensure top bound
        if (arr.length && arr[0].ly < 8) {
          const shift = 8 - arr[0].ly;
          for (let i = 0; i < arr.length; i++) arr[i].ly += shift;
        }
        // compute final label anchor X (a bit inside the label box)
        const LABEL_W = 140;
        arr.forEach(it => {
          it.labelX = side === 'left' ? Math.max(8, centerX - radius - LABEL_W - 8) : Math.min(width - LABEL_W - 8, centerX + radius + 8);
          it.labelY = it.ly - 10; // shift so text baseline lines up nicely
          // anchor point on label box (where the leader line will meet)
          it.anchorX = side === 'left' ? it.labelX + LABEL_W : it.labelX;
        });
      };

      adjust(left, 'left');
      adjust(right, 'right');

      const merged = [...left, ...right];
      setOverlayLabels(merged);
    };

    compute();
    // recompute on container resize
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => compute());
      if (chartRef.current) ro.observe(chartRef.current);
    } catch (e) {
      // ResizeObserver may not be available in some test environments; fallback to window resize
      const onResize = () => compute();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    return () => {
      if (ro && chartRef.current) ro.unobserve(chartRef.current);
    };
  }, [JSON.stringify(labeledServiceData)]);

  // Inline/internal pie labels removed: we render outside labels via an SVG overlay
  // (overlayLabels) so disable Recharts built-in labels and label lines below.

        return (
          <Card className="mt-4">
            <CardContent>
              <h3 className="text-lg font-medium mb-2">Leads by test/service type</h3>
              {serviceData.length === 0 ? (
                <div className="text-sm text-gray-500">No service data available</div>
              ) : (
                <div style={{ width: '100%', height: 320 }} className="flex items-center">
                  {/* left: fixed chart area to prevent overlap with table/content */}
                  <div ref={chartRef} style={{ flex: '0 0 62%', minWidth: 420, height: 320, position: 'relative' }} className="pr-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                            data={labeledServiceData}
                            dataKey="value"
                            nameKey="name"
                            cx="40%" /* shift pie left so labels/legend don't overlap page content */
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={false}
                            labelLine={false}
                            stroke="#ffffff"
                            strokeWidth={2}
                          >
                          {labeledServiceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Overlay: SVG leader lines + absolute labels (ensures all names are visible and non-overlapping) */}
                    <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      {overlayLabels.map((it: any, idx: number) => (
                        <g key={`line-${idx}`}> 
                          <line x1={it.sx} y1={it.sy} x2={it.anchorX} y2={it.ly} stroke={it.color} strokeWidth={1} strokeOpacity={0.9} />
                          <circle cx={it.sx} cy={it.sy} r={2} fill={it.color} />
                        </g>
                      ))}
                    </svg>

                    {overlayLabels.map((it: any, idx: number) => (
                      <div key={`lbl-${idx}`} style={{ position: 'absolute', left: it.labelX, top: it.labelY, width: 140 }} className="text-xs">
                        <div className="flex items-center space-x-2 bg-white/90 dark:bg-gray-900/80 rounded px-2 py-1 shadow-sm border">
                          <span style={{ width: 10, height: 10, background: it.color, display: 'inline-block', borderRadius: 2 }} />
                          <div className="truncate" style={{ maxWidth: 110, fontWeight: 600 }}>{it.labelText}</div>
                          <div className="ml-1 text-gray-600 font-medium">{it.pct}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* right: legend with fixed width */}
                  <div style={{ width: 280, flex: '0 0 280px', maxHeight: 320, overflowY: 'auto' }} className="pl-8">
                    <h4 className="text-sm font-medium mb-3">Legend</h4>
                    <ul className="space-y-3 text-sm">
                      {serviceData.map((d, i) => (
                        <li key={d.name} className="flex items-start bg-gray-50 dark:bg-gray-800/50 rounded-md p-2.5">
                          <span className="inline-block h-4 w-4 mt-0.5 mr-3 rounded-sm shadow-sm" style={{ background: COLORS[i % COLORS.length], border: '1px solid rgba(0,0,0,0.1)' }} />
                          <span className="flex-1 mr-3 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                          <span className="font-semibold ml-2 text-gray-700 dark:text-gray-300">{d.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Simple Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search org / doctor / email / phone / sample id" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
              <Select onValueChange={(v) => { setStatusFilter(v); setPage(1); }} value={statusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
              <div className="flex items-center space-x-2">
              <Label>Page size</Label>
              <Select onValueChange={(v) => { setPageSize(parseInt(v || '25', 10)); setPage(1); }} value={String(pageSize)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              
            </div>
          </div>
          
          <div className="border rounded-lg max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-20 border-b-2">
                <TableRow>
                  <TableHead onClick={() => { setSortKey('uniqueId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Unique ID{sortKey === 'uniqueId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('projectId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Project ID{sortKey === 'projectId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('leadType'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Lead Type{sortKey === 'leadType' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('status'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Status{sortKey === 'status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('organization'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Organisation / Hospital{sortKey === 'organization' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('referredDoctor'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Clinician / Researcher Name{sortKey === 'referredDoctor' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('specialty'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Speciality{sortKey === 'specialty' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('email'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Clinician / Researcher Email{sortKey === 'email' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('phone'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Clinician / Researcher Phone{sortKey === 'phone' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('clinicianAddress'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[140px]">Clinician / Researcher Address{sortKey === 'clinicianAddress' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('patientClientName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Patient / Client Name{sortKey === 'patientClientName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[200px]">Age</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Gender</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[80px]">Patient / Client Email</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[100px]">Patient / Client Phone</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Patient / Client Address</TableHead>
                  <TableHead onClick={() => { setSortKey('geneticCounsellorRequired'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Genetic Counselling Required{sortKey === 'geneticCounsellorRequired' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[200px]">Nutritional Counselling Required</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Service Name</TableHead>
                  <TableHead onClick={() => { setSortKey('sampleType'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Sample Type{sortKey === 'sampleType' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('noOfSamples'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">No of Samples{sortKey === 'noOfSamples' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Budget</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Sample Pick up from</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Delivery upto</TableHead>
                  <TableHead onClick={() => { setSortKey('dateSampleCollected'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[160px]">Sample Collection Date{sortKey === 'dateSampleCollected' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[140px]">Sample Shipped Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Sample Shipment Amount</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Tracking ID</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Courier Company</TableHead>
                  <TableHead onClick={() => { setSortKey('sampleReceivedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Sample Received Date{sortKey === 'sampleReceivedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[140px]">Phlebotomist Charges</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Progenics TRF</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Follow up</TableHead>
                  <TableHead onClick={() => { setSortKey('createdBy'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Lead Created By{sortKey === 'createdBy' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('salesResponsiblePerson'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Sales / Responsible Person{sortKey === 'salesResponsiblePerson' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('createdAt'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Lead Created{sortKey === 'createdAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('updatedAt'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Lead Modified{sortKey === 'updatedAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Remark / Comment</TableHead>
                  <TableHead className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 whitespace-nowrap font-semibold min-w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={41} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : visibleLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={41} className="text-center py-8">No leads found</TableCell>
                  </TableRow>
                ) : (
                  visibleLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="whitespace-nowrap">{lead.uniqueId ?? lead.id ?? (lead as any)?._raw?.unique_id ?? (lead as any)?._raw?.uniqueId ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.projectId ?? (lead as any)?._raw?.project_id ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={lead.leadType === 'project' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {lead.leadType || 'Individual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusBadgeColor(lead.status || 'quoted')}>
                          {lead.status || 'Quoted'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{lead.organization ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.referredDoctor ? `Dr. ${stripHonorific(lead.referredDoctor)}` : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.specialty ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.email ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.phone ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.clinicianAddress ?? lead.clinicHospitalName ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.patientClientName ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.age != null ? String(lead.age) : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.gender ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.patientClientEmail ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.patientClientPhone ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.patientAddress ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.geneticCounsellorRequired ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.nutritionRequired ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.serviceName ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.sampleType ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.noOfSamples != null ? String(lead.noOfSamples) : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.budget != null ? `₹${formatINR(Number(lead.budget))}` : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.pickupFrom ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.pickupUpto ? new Date(lead.pickupUpto).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.dateSampleCollected ? new Date(lead.dateSampleCollected).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.sampleShippedDate ? new Date(lead.sampleShippedDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.shippingAmount != null ? `₹${formatINR(Number(lead.shippingAmount))}` : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.trackingId ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.courierCompany ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.sampleReceivedDate ? new Date(lead.sampleReceivedDate).toLocaleDateString() : (lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : (lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '-'))}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.phlebotomistCharges != null ? `₹${formatINR(Number(lead.phlebotomistCharges))}` : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {(() => {
                          const v = lead.progenicsTRF;
                          if (!v) return '-';
                          try {
                            const parsed = typeof v === 'string' ? JSON.parse(v) : v;
                            if (parsed && parsed.name && parsed.data) {
                              return (
                                <a className="text-blue-600 underline" href={parsed.data} download={parsed.name}>
                                  {parsed.name}
                                </a>
                              );
                            }
                          } catch (e) {
                            // not JSON, fall back to plain text
                          }
                          return v;
                        })()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{lead.followUp ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{typeof lead.createdBy === 'object' ? (lead.createdBy as any)?.name ?? '-' : lead.createdBy ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.salesResponsiblePerson ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{(lead as any).remark ?? (lead as any).remarks ?? '-'}</TableCell>
                      <TableCell className="sticky right-0 bg-white dark:bg-gray-900 border-l-2">
                        <div className="flex space-x-2">
                          {canEdit(lead) && (
                          <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          )}
                          {canDelete() && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (!confirm('Delete this lead? This action cannot be undone.')) return;
                            // Server will create the recycle snapshot; do not create a duplicate on the client
                            deleteLeadMutation.mutate({ id: lead.id });
                          }}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                          )}
                          {/* Quick status badge in Actions for faster visibility and context */}
                          {/* Treat backend `completed` as visually `Converted` here. We show a badge
                             labelled "Converted" but keep action buttons hidden for completed rows. */}
                          <Badge className={`${getStatusBadgeColor(lead.status || 'quoted')} whitespace-nowrap px-2 py-1 text-xs`}>
                            {(lead.status || 'quoted').toString() === 'converted' ? 'Converted' : (lead.status || 'quoted').toString()}
                          </Badge>

                          {lead.status !== 'converted' && lead.status !== 'closed' && (
                            <>
                              {getNextStatus(lead.status || 'quoted') && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(lead.id, getNextStatus(lead.status || 'quoted')!)}
                                  disabled={updateLeadStatusMutation.isPending}
                                >
                                  {getNextStatus(lead.status || 'quoted') === 'cold' && '🔥 Mark Cold'}
                                  {getNextStatus(lead.status || 'quoted') === 'hot' && '🔥 Mark Hot'}
                                  {getNextStatus(lead.status || 'quoted') === 'won' && '✅ Mark Won'}
                                </Button>
                              )}
                              {lead.status === 'won' && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleConvertLead(lead.id)}
                                  disabled={convertLeadMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Convert
                                </Button>
                              )}
                              </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* Pagination controls */}
        <div className="p-4 flex items-center justify-between">
          <div>Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered}</div>
          <div className="flex items-center space-x-2">
            <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
            <div>Page {page} / {totalPages}</div>
            <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}