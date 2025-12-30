import { useState, useRef, useEffect, useMemo } from "react";
import { ConfirmationDialog, useConfirmationDialog } from "@/components/ConfirmationDialog";
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
import { useForm, Controller } from "react-hook-form";
import { useRecycle } from '@/contexts/RecycleContext';
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput from 'react-phone-number-input';
import { PDFViewer } from '@/components/PDFViewer';
import 'react-phone-number-input/style.css';
import '../styles/phone-input.css';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { insertLeadSchema, type Lead, type LeadWithUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateRoleId } from "@/lib/generateRoleId";
import { validatePhoneDigitCount, getNationalDigits, restrictPhoneInput, formatToE164, getDetectedCountryCode, getExpectedDigitCount, canAddMoreDigits } from "@/utils/phoneValidation";
import { z } from "zod";
import { FilterBar } from "@/components/FilterBar";
import { useColumnPreferences, ColumnConfig } from '@/hooks/useColumnPreferences';
import { ColumnSettings } from '@/components/ColumnSettings';


const leadFormSchema = insertLeadSchema.extend({
  // Organization & Clinician fields are optional for lead creation
  organisationHospital: z.string().optional(),

  // Clinician fields (optional) - allow blank values; when provided run basic validation
  clinicianResearcherName: z.string().optional(),

  clinicianResearcherAddress: z.string().optional(),

  // Clinician contact fields (optional). If provided, validate format; otherwise allow empty.
  clinicianResearcherEmail: z.string().optional().refine((val) => {
    if (!val || (typeof val === 'string' && val.trim() === '')) return true;
    try {
      // rely on zod/email check by delegating to a temp zod schema
      return z.string().email().max(255).safeParse(val).success;
    } catch (e) {
      return false;
    }
  }, { message: "Please enter a valid email address" }),

  clinicianResearcherPhone: z.string().optional().refine((phone) => {
    if (!phone || phone.trim() === '') return true; // allow empty
    return isValidPhoneNumber(phone as string);
  }, { message: "Please enter a valid international phone number" })
    .superRefine((phone, ctx) => {
      if (!phone || (typeof phone === 'string' && phone.trim() === '')) return; // skip when empty
      const validation = validatePhoneDigitCount(phone as string);
      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.message || "Invalid phone number digit count for the country"
        });
      }
    }),

  // Lead type validation
  leadType: z.string()
    .min(1, "Lead type is required")
    .max(100, "Lead type must not exceed 100 characters"),

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
    })
    .superRefine((phone, ctx) => {
      if (!phone || phone.trim() === '') return; // Let the required check handle this
      const validation = validatePhoneDigitCount(phone);
      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.message || "Invalid phone number digit count for the country"
        });
      }
    }),
  sampleId: z.string().optional(),
  patientClientAddress: z.string().optional(),

  // Additional fields for lead management
  speciality: z.string().optional(),
  geneticCounselorRequired: z.boolean().optional(),
  nutritionalCounsellingRequired: z.boolean().optional(),
  serviceName: z.string().optional(),
  budget: z.string().optional(),
  salesResponsiblePerson: z.string().optional(),
  noOfSamples: z.coerce.number().int().positive().optional().nullable(),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  patientClientEmail: z.string().email().optional().or(z.literal("")),
  // Tracking / pickup fields
  samplePickUpFrom: z.string().optional(),
  // date inputs - coerce string from HTML date input to Date object
  sampleCollectionDate: z.coerce.date().optional().nullable(),
  // store datetime as Date object and convert to ISO string before submission
  deliveryUpTo: z.coerce.date().optional().nullable(),
  // date when sample was shipped
  sampleShippedDate: z.coerce.date().optional().nullable(),
  sampleShipmentAmount: z.string().optional(),
  trackingId: z.string().optional(),
  courierCompany: z.string().optional(),
  progenicsTrf: z.string().optional(),
  phlebotomistCharges: z.string().optional(),
  testCategory: z.enum(['clinical', 'discovery']).optional(),
  remarkComment: z.string().optional(),
  sampleReceivedDate: z.coerce.date().optional().nullable(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

/**
 * Handle phone input change with dynamic country detection and digit limiting
 * Automatically restricts digits based on the country code detected from the phone value
 * E.g., India (+91) -> max 10 digits, USA (+1) -> max 10 digits, etc.
 */
function handlePhoneInputChange(
  value: string | undefined,
  onSetValue: (val: string) => void,
  onSetError?: (error: string | undefined) => void
) {
  if (!value) {
    onSetValue('');
    onSetError?.(undefined);
    return;
  }

  // Restrict to max digits for the detected country code
  // This is the KEY change - restrictPhoneInput now auto-detects country from phone value
  const restrictedValue = restrictPhoneInput(value);

  // Validate phone number
  if (!isValidPhoneNumber(restrictedValue)) {
    // Let it pass for now, validation will happen on form submission
    onSetValue(restrictedValue);
    onSetError?.("Please enter a valid international phone number");
    return;
  }

  // Validate digit count for country
  const digitValidation = validatePhoneDigitCount(restrictedValue);
  if (!digitValidation.isValid) {
    onSetValue(restrictedValue);
    onSetError?.(digitValidation.message);
    return;
  }

  onSetValue(restrictedValue);
  onSetError?.(undefined);
}

// Schema for editing leads - all fields optional to allow partial updates
const editLeadSchema = leadFormSchema.partial();

// Helper: convert string inputs that represent numbers into actual numbers and auto-populate timestamps
function coerceNumericFields(data: Partial<LeadFormData> | LeadFormData, userId?: string, isEditMode?: boolean) {
  const copy: any = { ...data };

  // Auto-populate leadCreatedBy and leadCreated for new leads (only if not already set)
  if (!isEditMode) {
    if (!copy.leadCreatedBy && userId) {
      copy.leadCreatedBy = userId;
    }
    if (!copy.leadCreated) {
      copy.leadCreated = new Date().toISOString();
    }
  }

  // Auto-populate leadModified on every update
  copy.leadModified = new Date().toISOString();

  const toDecimalString = (v: any) => {
    if (v === undefined || v === null || v === '') return null;
    // If already a string, keep as-is (assume it's a decimal string)
    if (typeof v === 'string') return v;
    // If number, convert to string with no loss of precision
    if (typeof v === 'number') return v.toString();
    const asNum = Number(v);
    return Number.isFinite(asNum) ? String(asNum) : null;
  };

  // Convert deliveryUpTo from Date object to ISO string for API submission
  if (copy.deliveryUpTo) {
    if (copy.deliveryUpTo instanceof Date) {
      if (!isNaN(copy.deliveryUpTo.getTime())) {
        copy.deliveryUpTo = copy.deliveryUpTo.toISOString();
      } else {
        copy.deliveryUpTo = null;
      }
    } else if (typeof copy.deliveryUpTo === 'string' && copy.deliveryUpTo.trim() !== '') {
      try {
        const d = new Date(copy.deliveryUpTo);
        if (!isNaN(d.getTime())) {
          copy.deliveryUpTo = d.toISOString();
        } else {
          copy.deliveryUpTo = null;
        }
      } catch (error) {
        copy.deliveryUpTo = null;
      }
    } else {
      copy.deliveryUpTo = null;
    }
  } else {
    copy.deliveryUpTo = null;
  }

  // Convert sampleCollectionDate from Date object to ISO string
  if (copy.sampleCollectionDate) {
    if (copy.sampleCollectionDate instanceof Date) {
      if (!isNaN(copy.sampleCollectionDate.getTime())) {
        copy.sampleCollectionDate = copy.sampleCollectionDate.toISOString();
      } else {
        copy.sampleCollectionDate = null;
      }
    } else if (typeof copy.sampleCollectionDate === 'string' && copy.sampleCollectionDate.trim() !== '') {
      try {
        const d = new Date(copy.sampleCollectionDate + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          copy.sampleCollectionDate = d.toISOString();
        } else {
          copy.sampleCollectionDate = null;
        }
      } catch (e) {
        copy.sampleCollectionDate = null;
      }
    } else {
      copy.sampleCollectionDate = null;
    }
  } else {
    copy.sampleCollectionDate = null;
  }

  // Convert sampleShippedDate from Date object to ISO string
  if (copy.sampleShippedDate) {
    if (copy.sampleShippedDate instanceof Date) {
      if (!isNaN(copy.sampleShippedDate.getTime())) {
        copy.sampleShippedDate = copy.sampleShippedDate.toISOString();
      } else {
        copy.sampleShippedDate = null;
      }
    } else if (typeof copy.sampleShippedDate === 'string' && copy.sampleShippedDate.trim() !== '') {
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
  } else {
    copy.sampleShippedDate = null;
  }

  // Convert sampleReceivedDate from Date object to ISO string
  if (copy.sampleReceivedDate) {
    if (copy.sampleReceivedDate instanceof Date) {
      if (!isNaN(copy.sampleReceivedDate.getTime())) {
        copy.sampleReceivedDate = copy.sampleReceivedDate.toISOString();
      } else {
        copy.sampleReceivedDate = null;
      }
    } else if (typeof copy.sampleReceivedDate === 'string' && copy.sampleReceivedDate.trim() !== '') {
      try {
        const d = new Date(copy.sampleReceivedDate + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          copy.sampleReceivedDate = d.toISOString();
        } else {
          copy.sampleReceivedDate = null;
        }
      } catch (e) {
        copy.sampleReceivedDate = null;
      }
    } else {
      copy.sampleReceivedDate = null;
    }
  } else {
    copy.sampleReceivedDate = null;
  }

  // Some server-side schema uses `dateSampleReceived` (DB column `date_sample_received`)
  // If client sent sampleShippedDate, copy it to dateSampleReceived so the
  // insert/update payload matches the server insert schema and persists to DB.
  if ((copy as any).sampleShippedDate && !(copy as any).dateSampleReceived) {
    (copy as any).dateSampleReceived = (copy as any).sampleShippedDate;
  }

  // If client sent sampleReceivedDate, ensure it maps to dateSampleReceived
  if ((copy as any).sampleReceivedDate) {
    (copy as any).dateSampleReceived = (copy as any).sampleReceivedDate;
  }

  // Decimal fields (drizzle decimal => zod string) must be sent as strings
  copy.amountQuoted = toDecimalString(copy.amountQuoted);
  copy.budget = toDecimalString(copy.budget);
  copy.sampleShipmentAmount = toDecimalString(copy.sampleShipmentAmount);
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

  // TAT is a string field in the database (varchar), keep it as string or null
  if (copy.tat !== undefined && copy.tat !== null && copy.tat !== '') {
    copy.tat = String(copy.tat).trim();
  } else {
    copy.tat = null;
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
    sampleId:
      get('sample_id', 'sampleId') ??
      get('sampleId', 'sampleId') ??
      (l.sample ? (l.sample.sampleId ?? l.sample.sample_id) : undefined) ??
      undefined,
    testName: undefined, // No longer in schema - map to serviceName instead
    serviceName: (() => {
      const serviceName = get('service_name', 'serviceName') ?? get('serviceName', 'serviceName');
      return serviceName;
    })(),
    // dates - mapped to new schema names
    sampleCollectionDate: get('sample_collection_date', 'sampleCollectionDate') || get('date_sample_collected', 'sampleCollectionDate') || get('sample_collected_date', 'sampleCollectionDate') || null,
    createdAt: get('created', 'createdAt') || get('created_at', 'createdAt') || get('createdAt', 'createdAt') || null,
    // Modified maps to converted_at per mapping (also keep updatedAt/backwards compat)
    convertedAt: get('converted_at', 'convertedAt') || get('convertedAt', 'convertedAt') || null,
    updatedAt: get('converted_at', 'updatedAt') || get('updatedAt', 'updatedAt') || get('converted_at', 'converted_at') || null,
    // lead/organisation fields
    leadType: get('lead_type', 'leadType') || get('leadType', 'leadType') || get('lead_type_discovery', 'lead_type_discovery') || undefined,
    // Normalize backend status values: treat legacy `completed` as `converted` so
    // the UI and filters remain consistent.
    status: ((): any => {
      const s = get('status', 'status');
      if (s === undefined || s === null) return undefined;
      if (String(s).toLowerCase() === 'completed') return 'converted';
      return String(s);
    })(),
    geneticCounselorRequired: get('genetic_counselor_required', 'geneticCounselorRequired') ?? get('geneticCounsellorRequired', 'geneticCounsellorRequired') ?? false,
    // Nutrition/counselling flags
    nutritionalCounsellingRequired: get('nutritional_counselling_required', 'nutritionalCounsellingRequired') || get('nutrition_required', 'nutritionalCounsellingRequired') || get('nutritional_counselling_required', 'nutritionalCounsellingRequired') || false,
    createdBy: get('lead_created_by', 'createdBy') || get('created_by', 'createdBy') || get('createdBy', 'createdBy') || undefined,
    salesResponsiblePerson: get('sales_responsible_person', 'salesResponsiblePerson') || get('salesResponsiblePerson', 'salesResponsiblePerson') || undefined,
    sampleType: get('sample_type', 'sampleType') || undefined,
    testCategory: get('test_category', 'testCategory') || undefined,
    // Map organization from database's organisation_hospital field
    organisationHospital:
      get('organisation_hospital', 'organisationHospital') ||
      get('organization', 'organisationHospital') ||
      get('organisation', 'organisationHospital') ||
      get('org', 'organisationHospital') ||
      get('hospital', 'organisationHospital') ||
      get('hospital_name', 'organisationHospital') ||
      get('clinic_name', 'organisationHospital') ||
      undefined,
    // clinician / researcher name from database column
    clinicianResearcherName: get('clinician_researcher_name', 'clinicianResearcherName') || get('clinician_name', 'clinicianResearcherName') || get('referredDoctor', 'clinicianResearcherName') || get('referred_doctor', 'clinicianResearcherName') || undefined,
    // Accept both US and British spellings from backend: `specialty` and `speciality`
    speciality: get('speciality', 'speciality') || get('specialty', 'speciality') || undefined,
    // clinician emails / phones from database
    clinicianResearcherEmail: get('clinician_researcher_email', 'clinicianResearcherEmail') || get('clinician_org_email', 'clinicianResearcherEmail') || get('email', 'clinicianResearcherEmail') || undefined,
    clinicianResearcherPhone: get('clinician_researcher_phone', 'clinicianResearcherPhone') || get('clinician_org_phone', 'clinicianResearcherPhone') || get('phone', 'clinicianResearcherPhone') || undefined,
    // clinician / researcher address from database
    clinicianResearcherAddress:
      get('clinician_researcher_address', 'clinicianResearcherAddress') ||
      get('clinician_address', 'clinicianResearcherAddress') ||
      get('clinic_hospital_address', 'clinicianResearcherAddress') ||
      get('clinic_address', 'clinicianResearcherAddress') ||
      get('clinician_org_address', 'clinicianResearcherAddress') ||
      undefined,
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
    patientClientAddress: get('patient_client_address', 'patientClientAddress') || get('patient_address', 'patientClientAddress') || undefined,
    noOfSamples: get('no_of_samples', 'noOfSamples') ?? get('noOfSamples', 'noOfSamples') ?? undefined,
    age: get('age', 'age') ?? undefined,
    gender: get('gender', 'gender') || undefined,
    budget: get('budget', 'budget') ?? undefined,
    followUp: get('follow_up', 'followUp') || undefined,
    samplePickUpFrom:
      get('sample_pick_up_from', 'samplePickUpFrom') ||
      get('pickup_from', 'samplePickUpFrom') ||
      get('sample_pickup_from', 'samplePickUpFrom') ||
      get('pickup_location', 'samplePickUpFrom') ||
      get('collection_point', 'samplePickUpFrom') ||
      undefined,
    deliveryUpTo:
      get('delivery_up_to', 'deliveryUpTo') ||
      get('delivery_upto', 'deliveryUpTo') ||
      get('pickup_upto', 'deliveryUpTo') ||
      get('deliveryUpto', 'deliveryUpTo') ||
      undefined,
    // sample shipped/date received
    sampleShippedDate:
      get('sample_shipped_date', 'sampleShippedDate') ||
      get('sampleShippedDate', 'sampleShippedDate') ||
      get('date_sample_shipped', 'sampleShippedDate') ||
      undefined,
    // sampleReceivedDate from database column
    sampleReceivedDate:
      get('sample_recevied_date', 'sampleReceivedDate') ||  // Note: DB typo
      get('sample_received_date', 'sampleReceivedDate') ||
      get('date_sample_received', 'sampleReceivedDate') ||
      get('dateSampleReceived', 'sampleReceivedDate') ||
      undefined,
    sampleShipmentAmount:
      get('sample_shipment_amount', 'sampleShipmentAmount') ??
      get('shipping_amount', 'sampleShipmentAmount') ??
      get('shipment_amount', 'sampleShipmentAmount') ??
      get('courier_charges', 'sampleShipmentAmount') ??
      get('courier_charge', 'sampleShipmentAmount') ??
      undefined,
    trackingId: get('tracking_id', 'trackingId') || undefined,
    courierCompany: get('courier_company', 'courierCompany') || undefined,
    progenicsTrf: get('progenics_trf', 'progenicsTrf') || get('progenicsTRF', 'progenicsTrf') || undefined,
    phlebotomistCharges: get('phlebotomist_charges', 'phlebotomistCharges') ?? undefined,
    // pricing / misc
    amountQuoted: get('amount_quoted', 'amountQuoted') ?? get('amountQuoted', 'amountQuoted') ?? undefined,
    tat: get('tat', 'tat') ?? undefined,
    remarkComment: get('remark_comment', 'remarkComment') || get('remarks', 'remarkComment') || get('comments', 'remarkComment') || undefined,
    // audit fields - who created and when
    leadCreatedBy: get('lead_created_by', 'leadCreatedBy') || get('createdBy', 'leadCreatedBy') || undefined,
    leadCreated: get('lead_created', 'leadCreated') || get('createdAt', 'leadCreated') || undefined,
    leadModified: get('lead_modified', 'leadModified') || get('modifiedAt', 'leadModified') || undefined,
    // keep raw original for debugging if needed
    _raw: l,
  };

  return normalized;
}

export default function LeadManagement() {
  // Helper: convert Date to YYYY-MM-DD string for date input
  const formatDateForInput = (date: any): string => {
    if (!date) return '';
    try {
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof date === 'string') {
        // If it's already a date string (YYYY-MM-DD format)
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        // If it's an ISO string, extract the date part
        if (date.includes('T')) return date.split('T')[0];
        return '';
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  // Helper: convert datetime-local string to Date object
  const parseLocalDatetime = (value: string): Date | null => {
    if (!value) return null;
    try {
      return new Date(value);
    } catch (e) {
      return null;
    }
  };

  // Helper: format Date to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatDatetimeForInput = (date: any): string => {
    if (!date) return '';
    try {
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      if (typeof date === 'string') {
        // If it's a datetime-local format already
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)) return date;
        // If it's an ISO string, convert to datetime-local
        if (date.includes('T')) {
          const dt = new Date(date);
          const year = dt.getFullYear();
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          const hours = String(dt.getHours()).padStart(2, '0');
          const minutes = String(dt.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  // Helper: get minimum date for dependent date fields (YYYY-MM-DD format for HTML date input)
  // Returns the Sample Collection Date, or empty string if not set
  const getMinDateForDependentFields = (sampleCollectionDate: any): string => {
    if (!sampleCollectionDate) return '';
    try {
      if (sampleCollectionDate instanceof Date) {
        const year = sampleCollectionDate.getFullYear();
        const month = String(sampleCollectionDate.getMonth() + 1).padStart(2, '0');
        const day = String(sampleCollectionDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof sampleCollectionDate === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(sampleCollectionDate)) return sampleCollectionDate;
        if (sampleCollectionDate.includes('T')) return sampleCollectionDate.split('T')[0];
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  // Helper: get minimum date for Delivery Up To field (datetime-local format YYYY-MM-DDTHH:mm)
  const getMinDatetimeForDeliveryUpTo = (sampleCollectionDate: any): string => {
    if (!sampleCollectionDate) return '';
    try {
      if (sampleCollectionDate instanceof Date) {
        const year = sampleCollectionDate.getFullYear();
        const month = String(sampleCollectionDate.getMonth() + 1).padStart(2, '0');
        const day = String(sampleCollectionDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00`;
      }
      if (typeof sampleCollectionDate === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(sampleCollectionDate)) return `${sampleCollectionDate}T00:00`;
        if (sampleCollectionDate.includes('T')) return sampleCollectionDate.substring(0, 16); // YYYY-MM-DDTHH:mm
      }
    } catch (e) {
      return '';
    }
    return '';
  };

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

  const [selectedTitle, setSelectedTitle] = useState<string>('Dr');
  const [clinicianName, setClinicianName] = useState<string>('');
  const [editSelectedTitle, setEditSelectedTitle] = useState<string>('Dr');
  const [editClinicianName, setEditClinicianName] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteConfirmation = useConfirmationDialog();
  const editConfirmation = useConfirmationDialog();
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

  // Fetch all users to map user IDs to names
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Fetch leads stats for revenue tiles
  const { data: leadsStats } = useQuery<{
    projectedRevenue: number;
    actualRevenue: number;
    totalLeads: number;
    activeLeads: number;
    convertedLeads: number;
  }>({
    queryKey: ['/api/leads/stats'],
    queryFn: async () => {
      const res = await fetch('/api/leads/stats');
      if (!res.ok) throw new Error('Failed to fetch leads stats');
      return res.json();
    },
  });

  // Helper function to get user name by ID
  const getUserNameById = (userId: string | undefined): string => {
    if (!userId) return '-';
    const user = allUsers.find(u => u.id === userId);
    return user?.name ?? userId;
  };

  // Project samples (new integration)
  const { data: projectSamples = [] } = useQuery<any[]>({ queryKey: ['/api/leads'] });

  // Normalize incoming leads to consistent camelCase shape
  const leadSource = (Array.isArray(projectSamples) && projectSamples.length > 0) ? projectSamples : leads;
  const normalizedLeads = Array.isArray(leadSource) ? leadSource.map(normalizeLead) : [];

  // Client-side search & pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dateFilterField, setDateFilterField] = useState<string>('leadCreated');
  // use a non-empty value for the Select; Radix Select does not accept empty-string items
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Column configuration for hide/show feature
  const leadColumns: ColumnConfig[] = useMemo(() => [
    { id: 'uniqueId', label: 'Unique ID', canHide: false }, // Primary identifier
    { id: 'projectId', label: 'Project ID', defaultVisible: true },
    { id: 'leadType', label: 'Lead Type', defaultVisible: true },
    { id: 'status', label: 'Status', defaultVisible: true },
    { id: 'organisationHospital', label: 'Organisation / Hospital', defaultVisible: true },
    { id: 'clinicianResearcherName', label: 'Clinician / Researcher Name', defaultVisible: true },
    { id: 'speciality', label: 'Speciality', defaultVisible: false },
    { id: 'clinicianResearcherEmail', label: 'Clinician / Researcher Email', defaultVisible: false },
    { id: 'clinicianResearcherPhone', label: 'Clinician / Researcher Phone', defaultVisible: false },
    { id: 'clinicianResearcherAddress', label: 'Clinician / Researcher Address', defaultVisible: false },
    { id: 'patientClientName', label: 'Patient / Client Name', defaultVisible: true },
    { id: 'age', label: 'Age', defaultVisible: false },
    { id: 'gender', label: 'Gender', defaultVisible: false },
    { id: 'patientClientEmail', label: 'Patient / Client Email', defaultVisible: false },
    { id: 'patientClientPhone', label: 'Patient / Client Phone', defaultVisible: true },
    { id: 'patientClientAddress', label: 'Patient / Client Address', defaultVisible: false },
    { id: 'geneticCounsellorRequired', label: 'Genetic Counselling Required', defaultVisible: false },
    { id: 'nutritionalCounsellingRequired', label: 'Nutritional Counselling Required', defaultVisible: false },
    { id: 'serviceName', label: 'Service Name', defaultVisible: true },
    { id: 'amountQuoted', label: 'Amount Quoted', defaultVisible: true },
    { id: 'tat', label: 'TAT (Days)', defaultVisible: true },
    { id: 'sampleType', label: 'Sample Type', defaultVisible: true },
    { id: 'noOfSamples', label: 'No of Samples', defaultVisible: false },
    { id: 'budget', label: 'Budget', defaultVisible: false },
    { id: 'samplePickUpFrom', label: 'Sample Pick up from', defaultVisible: false },
    { id: 'deliveryUpTo', label: 'Delivery upto', defaultVisible: false },
    { id: 'sampleCollectionDate', label: 'Sample Collection Date', defaultVisible: true },
    { id: 'sampleShippedDate', label: 'Sample Shipped Date', defaultVisible: false },
    { id: 'sampleShipmentAmount', label: 'Sample Shipment Amount', defaultVisible: false },
    { id: 'trackingId', label: 'Tracking ID', defaultVisible: false },
    { id: 'courierCompany', label: 'Courier Company', defaultVisible: false },
    { id: 'sampleReceivedDate', label: 'Sample Received Date', defaultVisible: false },
    { id: 'phlebotomistCharges', label: 'Phlebotomist Charges', defaultVisible: false },
    { id: 'progenicsTrf', label: 'Progenics TRF', defaultVisible: false },
    { id: 'followUp', label: 'Follow up', defaultVisible: false },
    { id: 'leadCreatedBy', label: 'Lead Created By', defaultVisible: false },
    { id: 'salesResponsiblePerson', label: 'Sales / Responsible Person', defaultVisible: false },
    { id: 'leadCreated', label: 'Lead Created', defaultVisible: false },
    { id: 'leadModified', label: 'Lead Modified', defaultVisible: false },
    { id: 'remarkComment', label: 'Remark / Comment', defaultVisible: true },
    { id: 'actions', label: 'Actions', canHide: false }, // Always visible
  ], []);

  // Column visibility preferences (per-user)
  const leadColumnPrefs = useColumnPreferences('lead_management_table', leadColumns);


  // Apply role-based filtering first
  const roleFilteredLeads = filterLeadsByRole(normalizedLeads);

  // Derived filtered leads (apply role filter + search + status)
  const filteredLeads = roleFilteredLeads.filter((lead) => {
    // 1. Status Filter
    if (statusFilter && statusFilter !== 'all' && String(lead.status) !== String(statusFilter)) {
      return false;
    }

    // 2. Search Query (Global)
    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = (
        (String(lead.uniqueId || '')).toLowerCase().includes(q) ||
        (String(lead.projectId || '')).toLowerCase().includes(q) ||
        (String(lead.patientClientName || '')).toLowerCase().includes(q) ||
        (String(lead.patientClientPhone || '')).toLowerCase().includes(q)
      );
    }

    // 3. Date Range Filter
    let matchesDate = true;
    if (dateRange.from) {
      const dateVal = (lead as any)[dateFilterField];
      if (dateVal) {
        const d = new Date(dateVal);
        // Normalize 'from' date to start of day
        const fromTime = new Date(dateRange.from).setHours(0, 0, 0, 0);
        // Normalize 'to' date to end of day, or if no 'to' date, use 'from' date's end of day
        const toTime = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : new Date(dateRange.from).setHours(23, 59, 59, 999);

        matchesDate = d.getTime() >= fromTime && d.getTime() <= toTime;
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
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
      const leadData = { ...coerceNumericFields(data, user?.id, false) } as Record<string, any>;
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

      const response = await apiRequest('POST', '/api/leads', leadData);
      return response.json();
    },
    onSuccess: async (createdLead: any, variables?: LeadFormData) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      // Invalidate dashboard stats when lead is created
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      setIsCreateDialogOpen(false);
      // Reset title and name states
      setSelectedTitle('Dr');
      setClinicianName('');
      // Reset title and name states
      setSelectedTitle('Dr');
      setClinicianName('');

      form.reset();
      toast({ title: "Lead created", description: "New lead has been successfully created" });

      // GC record auto-creation removed - backend now handles this automatically
      // when geneticCounselorRequired=true is set during lead creation.
      // Invalidate GC queries to show the auto-created record
      if (variables?.geneticCounselorRequired) {
        queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
        queryClient.invalidateQueries({ queryKey: ['/api/genetic-counselling-sheet'] });
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
      const leadDataRaw = { ...coerceNumericFields(data as LeadFormData, user?.id, true) } as Record<string, any>;
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
      // Force immediate refetch of queries to show updated data
      await queryClient.invalidateQueries({ queryKey: ['/api/leads'], refetchType: 'all' });
      // Invalidate dashboard stats when lead is updated
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'], refetchType: 'all' });
      setIsEditDialogOpen(false);
      setSelectedLead(null);
      editForm.reset();
      toast({ title: "Lead updated", description: "Lead has been successfully updated" });

      // GC record auto-creation removed for lead updates.
      // If user enables geneticCounselorRequired on an existing lead that doesn't have a GC record,
      // they should manually create it from the Genetic Counselling page.
      // This prevents duplicate GC records with wrong unique_id values.

      // Invalidate GC queries if geneticCounselorRequired changed
      if (variables?.data?.geneticCounselorRequired !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
        queryClient.invalidateQueries({ queryKey: ['/api/genetic-counselling-sheet'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/finance-sheet'] });
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
          try { toast({ title: 'Partial sync', description: 'Some downstream systems could not be updated automatically' }); } catch (e) { }
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
      projectId: lead?.projectId || lead?._raw?.project_id || sample?.projectId || sample?.project_id || null,
      organisationHospital: lead?.organisationHospital || lead?._raw?.organisation_hospital || null,
      clinicianResearcherName: lead?.clinicianResearcherName || lead?._raw?.clinician_researcher_name || null,
      patientClientName: lead?.patientClientName || lead?._raw?.patient_client_name || null,
    };

    // Process Master: create/process a workflow entry
    await tryPost('/api/process-master', { ...common, action: 'create_from_conversion' });

    // Genetic Counselling: REMOVED - Backend handles GC creation during conversion
    // (see server/routes.ts POST /api/leads/:id/convert)
    // The frontend reconciliation was causing duplicate GC records with wrong unique_id values.

    // Sample Tracking: create sample record if API supports it
    await tryPost('/api/samples', { sampleId: common.sampleId, leadId: common.leadId, source: 'conversion' });

    // Finance: create finance record placeholder with projectId (use adapter)
    await tryPost('/api/finance-sheet', { unique_id: common.leadId || '', sample_id: common.sampleId, project_id: common.projectId, invoice_amount: sample?.amount || lead?.amountQuoted || null, payment_status: 'pending' });

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
    queryClient.invalidateQueries({ queryKey: ['/api/finance-sheet'] });
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
      organisationHospital: '',
      clinicianResearcherName: '',
      clinicianResearcherAddress: '',
      clinicianResearcherEmail: '',
      clinicianResearcherPhone: '',
      patientClientName: '',
      age: undefined,
      gender: 'Male',
      patientClientPhone: '',
      patientClientEmail: '',
      patientClientAddress: '',
      sampleType: '',
      noOfSamples: undefined,
      budget: '',
      amountQuoted: "",
      tat: '14',
      sampleShipmentAmount: '',
      phlebotomistCharges: '',
      geneticCounselorRequired: false,
      nutritionalCounsellingRequired: false,
      samplePickUpFrom: '',
      deliveryUpTo: null,
      sampleCollectionDate: null,
      sampleShippedDate: null,
      sampleReceivedDate: null,
      trackingId: '',
      courierCompany: '',
      progenicsTrf: '',
      followUp: '',
      remarkComment: '',
      serviceName: '',
      speciality: '',
      leadType: 'individual',
      status: 'quoted',
      testCategory: 'clinical',
      salesResponsiblePerson: '',
      sampleId: '',
      uniqueId: '',
      projectId: '',
    },
  });

  const editForm = useForm<LeadFormData>({
    resolver: zodResolver(editLeadSchema),
    mode: 'onBlur', // Trigger validation when user leaves a field
    reValidateMode: 'onChange', // Re-validate on every change after first validation
    defaultValues: {
      organisationHospital: '',
      clinicianResearcherName: '',
      clinicianResearcherAddress: '',
      clinicianResearcherEmail: '',
      clinicianResearcherPhone: '',
      patientClientName: '',
      age: undefined,
      gender: 'Male',
      patientClientPhone: '',
      patientClientEmail: '',
      patientClientAddress: '',
      sampleType: '',
      noOfSamples: undefined,
      budget: '',
      amountQuoted: "",
      tat: '14',
      sampleShipmentAmount: '',
      phlebotomistCharges: '',
      geneticCounselorRequired: false,
      nutritionalCounsellingRequired: false,
      samplePickUpFrom: '',
      deliveryUpTo: null,
      sampleCollectionDate: null,
      sampleShippedDate: null,
      sampleReceivedDate: null,
      trackingId: '',
      courierCompany: '',
      progenicsTrf: '',
      followUp: '',
      remarkComment: '',
      serviceName: '',
      speciality: '',
      leadType: 'individual',
      status: 'quoted',
      testCategory: 'clinical',
      salesResponsiblePerson: '',
      sampleId: '',
      uniqueId: '',
      projectId: '',
    },
  });

  // Auto-correct phone numbers if they exceed max digits (for paste handling)
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Check patientClientPhone
      if (value.patientClientPhone) {
        const { actualDigits, expectedDigits, countryCode } = validatePhoneDigitCount(value.patientClientPhone);
        if (expectedDigits && actualDigits > expectedDigits) {
          const corrected = restrictPhoneInput(value.patientClientPhone, 'IN');
          if (corrected !== value.patientClientPhone) {
            form.setValue('patientClientPhone', corrected);
          }
        }
      }
      // Check clinicianResearcherPhone
      if (value.clinicianResearcherPhone) {
        const { actualDigits, expectedDigits } = validatePhoneDigitCount(value.clinicianResearcherPhone);
        if (expectedDigits && actualDigits > expectedDigits) {
          const corrected = restrictPhoneInput(value.clinicianResearcherPhone, 'IN');
          if (corrected !== value.clinicianResearcherPhone) {
            form.setValue('clinicianResearcherPhone', corrected);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-correct phone numbers in edit form as well
  useEffect(() => {
    const subscription = editForm.watch((value) => {
      // Check patientClientPhone
      if (value.patientClientPhone) {
        const { actualDigits, expectedDigits } = validatePhoneDigitCount(value.patientClientPhone);
        if (expectedDigits && actualDigits > expectedDigits) {
          const corrected = restrictPhoneInput(value.patientClientPhone, 'IN');
          if (corrected !== value.patientClientPhone) {
            editForm.setValue('patientClientPhone', corrected);
          }
        }
      }
      // Check clinicianResearcherPhone
      if (value.clinicianResearcherPhone) {
        const { actualDigits, expectedDigits } = validatePhoneDigitCount(value.clinicianResearcherPhone);
        if (expectedDigits && actualDigits > expectedDigits) {
          const corrected = restrictPhoneInput(value.clinicianResearcherPhone, 'IN');
          if (corrected !== value.clinicianResearcherPhone) {
            editForm.setValue('clinicianResearcherPhone', corrected);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [editForm]);

  const onSubmit = async (data: any) => {
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

  const onEditSubmit = (data: any) => {
    if (!selectedLead) return;
    editConfirmation.confirmEdit({
      title: 'Update Lead',
      description: `Are you sure you want to save changes to the lead for "${selectedLead.patientClientName || selectedLead.uniqueId}"?`,
      onConfirm: () => {
        const updateData = {
          ...data,
          modifiedBy: user?.name || user?.email || 'system'
        };
        updateLeadMutation.mutate({ id: selectedLead.id, data: updateData });
        editConfirmation.hideConfirmation();
      }
    });
  };

  const { add } = useRecycle();

  const handleEditLead = (lead: Lead) => {
    // lead may be normalized already; ensure UI selectedLead holds raw id
    setSelectedLead(lead as any);
    const category = (lead as any).testCategory || (lead as any).category || 'clinical';
    setEditSelectedCategory(category === 'clinical' || category === 'discovery' ? category : 'clinical');
    setEditSelectedLeadType((lead as any).leadType || 'individual');

    // Parse referredDoctor into title and name for edit state
    const referredDoctor = (lead as any).clinicianResearcherName || '';
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
      organisationHospital: (lead as any).organisationHospital || '',
      clinicianResearcherName: (lead as any).clinicianResearcherName || '',
      clinicianResearcherAddress: (lead as any).clinicianResearcherAddress || '',
      clinicianResearcherPhone: (lead as any).clinicianResearcherPhone || '',
      clinicianResearcherEmail: (lead as any).clinicianResearcherEmail || '',
      sampleType: (lead as any).sampleType || '',
      amountQuoted: (lead as any).amountQuoted != null ? String((lead as any).amountQuoted) : '',
      tat: (lead as any).tat || '14',
      status: (lead as any).status || 'quoted',
      speciality: (lead as any).speciality || '',
      serviceName: (lead as any).serviceName || '',
      leadType: (lead as any).leadType || 'individual',
      testCategory: (lead as any).testCategory || 'clinical',
      followUp: (lead as any).followUp || '',
      budget: (lead as any).budget != null ? String((lead as any).budget) : '',
      salesResponsiblePerson: (lead as any).salesResponsiblePerson || '',
      noOfSamples: (lead as any).noOfSamples || undefined,
      patientClientName: (lead as any).patientClientName || '',
      age: (lead as any).age || undefined,
      patientClientAddress: (lead as any).patientClientAddress || '',
      gender: (lead as any).gender || 'Male',
      patientClientPhone: (lead as any).patientClientPhone || '',
      patientClientEmail: (lead as any).patientClientEmail || '',
      // date fields - as Date objects
      sampleCollectionDate: (lead as any).sampleCollectionDate ? new Date((lead as any).sampleCollectionDate) : null,
      // tracking fields - as Date objects
      samplePickUpFrom: (lead as any).samplePickUpFrom || '',
      deliveryUpTo: (lead as any).deliveryUpTo ? new Date((lead as any).deliveryUpTo) : null,
      sampleShippedDate: (lead as any).sampleShippedDate ? new Date((lead as any).sampleShippedDate) : null,
      sampleShipmentAmount: (lead as any).sampleShipmentAmount != null ? String((lead as any).sampleShipmentAmount) : '',
      trackingId: (lead as any).trackingId || '',
      courierCompany: (lead as any).courierCompany || '',
      progenicsTrf: (lead as any).progenicsTrf || '',
      phlebotomistCharges: (lead as any).phlebotomistCharges != null ? String((lead as any).phlebotomistCharges) : '',
      nutritionalCounsellingRequired: (lead as any).nutritionalCounsellingRequired != null ? !!(lead as any).nutritionalCounsellingRequired : false,
      sampleReceivedDate: (lead as any).sampleReceivedDate ? new Date((lead as any).sampleReceivedDate) : null,
      geneticCounselorRequired: (lead as any).geneticCounselorRequired != null ? !!(lead as any).geneticCounselorRequired : false,
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
            <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto dialog-content">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription>Create leads for individual tests or projects. Fields are organized to match the table structure.</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Section 1: Lead Info */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Lead Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>Lead Type <span className="text-red-500">*</span></Label>
                      <Select onValueChange={(value) => {
                        form.setValue('leadType', value);
                        setSelectedLeadType(value);
                      }} defaultValue="individual">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Test</SelectItem>
                          <SelectItem value="project">Project/Bulk Testing</SelectItem>
                          <SelectItem value="clinical_trial">Clinical Trial</SelectItem>
                          <SelectItem value="R&D">R&D</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.leadType && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.leadType.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Status</Label>
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
                      <Label>Sales / Responsible Person</Label>
                      <Select onValueChange={(value) => form.setValue('salesResponsiblePerson', value)} defaultValue={form.getValues('salesResponsiblePerson') || ''}>
                        <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SHIVA KUMAR Y M">SHIVA KUMAR Y M</SelectItem>
                          <SelectItem value="Vakumulu Srikanth">Vakumulu Srikanth</SelectItem>
                          <SelectItem value="Dr. Y Aruna Priya">Dr. Y Aruna Priya</SelectItem>
                          <SelectItem value="Dr Krishnasai Reddy">Dr Krishnasai Reddy</SelectItem>
                          <SelectItem value="S Karthik Iyer">S Karthik Iyer</SelectItem>
                          <SelectItem value="Dr. Swapnil Chandrakant Kajale">Dr. Swapnil Chandrakant Kajale</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Label>Test Category</Label>
                      <Controller
                        name="testCategory"
                        control={form.control}
                        defaultValue="clinical"
                        render={({ field }) => (
                          <Select value={field.value || "clinical"} onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-generate sampleId logic based on testCategory
                            try {
                              const current = form.getValues('sampleId') || '';
                              const prefix = value === 'clinical' ? 'PG' : 'DG';
                              const hasCorrectPrefix = current && (current.startsWith(prefix) || current.startsWith(prefix + '-'));
                              if (!current || !hasCorrectPrefix) {
                                const suffix = Math.floor(100000 + Math.random() * 900000).toString();
                                form.setValue('sampleId', `${prefix}-${suffix}`);
                              }
                            } catch (e) { }
                          }}>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clinical">Clinical</SelectItem>
                              <SelectItem value="discovery">Discovery</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
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
                      <Input {...form.register('tat')} placeholder="e.g., 14" />
                    </div>
                  </div>
                </div>              {/* Section 2: Organization / Clinician */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium mb-4">Organization & Clinician</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Organisation / Hospital</Label>
                      <Input {...form.register('organisationHospital')} placeholder="Hospital/Clinic Name" />
                      {form.formState.errors.organisationHospital && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.organisationHospital.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Name</Label>
                      <div className="flex gap-2">
                        <Select
                          value={selectedTitle}
                          onValueChange={(value) => {
                            setSelectedTitle(value);
                            form.setValue('clinicianResearcherName', `${value} ${stripHonorific(clinicianName)}`.trim());
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
                            form.setValue('clinicianResearcherName', `${selectedTitle} ${stripHonorific(e.target.value)}`.trim());
                          }}
                          placeholder="Name"
                          className="flex-1"
                        />
                      </div>
                      {form.formState.errors.clinicianResearcherName && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.clinicianResearcherName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Speciality</Label>
                      <Input {...form.register('speciality')} placeholder="Genetics, Oncology, etc." />
                    </div>
                    <div>
                      <Label>Clinician / Researcher Email</Label>
                      <Input {...form.register('clinicianResearcherEmail')} placeholder="doctor@hospital.com" />
                      {form.formState.errors.clinicianResearcherEmail && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.clinicianResearcherEmail.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Phone</Label>
                      <div className="phone-input-wrapper">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="IN"
                          value={form.watch('clinicianResearcherPhone') || ''}
                          onChange={(value) => {
                            const phoneValue = value || '';

                            // Get the national digits (without country code)
                            const nationalDigits = getNationalDigits(phoneValue);
                            const countryCode = getDetectedCountryCode(phoneValue) || 'IN';
                            const maxDigits = getExpectedDigitCount(countryCode) || 10;

                            // Restrict and format
                            const restrictedValue = restrictPhoneInput(phoneValue, 'IN');
                            form.setValue('clinicianResearcherPhone', restrictedValue);

                            // Trigger validation
                            if (restrictedValue) {
                              form.trigger('clinicianResearcherPhone');
                            }
                          }}
                          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                            // Handle paste events to ensure value is immediately truncated
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const restrictedValue = restrictPhoneInput(pastedText, 'IN');
                            form.setValue('clinicianResearcherPhone', restrictedValue);
                            if (restrictedValue) {
                              form.trigger('clinicianResearcherPhone');
                            }
                          }}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {form.formState.errors.clinicianResearcherPhone && (
                        <p className="text-sm text-red-600 mt-1">{typeof form.formState.errors.clinicianResearcherPhone.message === 'string' ? form.formState.errors.clinicianResearcherPhone.message : 'Invalid phone number'}</p>
                      )}
                      {form.watch('clinicianResearcherPhone') && !form.formState.errors.clinicianResearcherPhone && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Valid phone number
                          {(() => {
                            const country = getDetectedCountryCode(form.watch('clinicianResearcherPhone'));
                            const expectedDigits = country ? getExpectedDigitCount(country) : null;
                            const nationalDigits = getNationalDigits(form.watch('clinicianResearcherPhone'));
                            return country && expectedDigits ? ` (${country}: ${nationalDigits.length}/${expectedDigits} digits)` : '';
                          })()}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Address</Label>
                      <Input {...form.register('clinicianResearcherAddress')} placeholder="Clinic / Hospital address" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Patient Details */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Patient Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>Patient / Client Name <span className="text-red-500">*</span></Label>
                      <Input {...form.register('patientClientName')} placeholder="Patient full name" />
                      {form.formState.errors.patientClientName && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.patientClientName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input {...form.register('age', { valueAsNumber: true })} type="number" placeholder="e.g., 35" />
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
                    <div>
                      <Label>Patient / Client Email</Label>
                      <Input {...form.register('patientClientEmail')} placeholder="patient@example.com" />
                    </div>
                    <div>
                      <Label>Patient / Client Phone <span className="text-red-500">*</span></Label>
                      <div className="phone-input-wrapper">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="IN"
                          value={form.watch('patientClientPhone') || ''}
                          onChange={(value) => {
                            const phoneValue = value || '';

                            // Get the national digits (without country code)
                            const nationalDigits = getNationalDigits(phoneValue);
                            const countryCode = getDetectedCountryCode(phoneValue) || 'IN';
                            const maxDigits = getExpectedDigitCount(countryCode) || 10;

                            // Restrict and format
                            const restrictedValue = restrictPhoneInput(phoneValue, 'IN');
                            form.setValue('patientClientPhone', restrictedValue);

                            // Trigger validation
                            if (restrictedValue) {
                              form.trigger('patientClientPhone');
                            }
                          }}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            // Prevent adding more digits if max reached
                            if (/\d/.test(e.key)) {
                              const currentValue = form.watch('patientClientPhone') || '';
                              const { canAdd } = canAddMoreDigits(currentValue, e.key);
                              if (!canAdd) {
                                e.preventDefault();
                              }
                            }
                          }}
                          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                            // Handle paste events to ensure value is immediately truncated
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const restrictedValue = restrictPhoneInput(pastedText, 'IN');
                            form.setValue('patientClientPhone', restrictedValue);
                            if (restrictedValue) {
                              form.trigger('patientClientPhone');
                            }
                          }}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {form.formState.errors.patientClientPhone && (
                        <p className="text-sm text-red-600 mt-1">{typeof form.formState.errors.patientClientPhone.message === 'string' ? form.formState.errors.patientClientPhone.message : 'Invalid phone number'}</p>
                      )}
                      {form.watch('patientClientPhone') && !form.formState.errors.patientClientPhone && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Valid phone number
                          {(() => {
                            const country = getDetectedCountryCode(form.watch('patientClientPhone'));
                            const expectedDigits = country ? getExpectedDigitCount(country) : null;
                            const nationalDigits = getNationalDigits(form.watch('patientClientPhone'));
                            return country && expectedDigits ? ` (${country}: ${nationalDigits.length}/${expectedDigits} digits)` : '';
                          })()}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Patient / Client Address</Label>
                      <Input {...form.register('patientClientAddress')} placeholder="Patient address" />
                    </div>
                  </div>
                </div>

                {/* Section 4: Sample & Logistics */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Sample & Logistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>No of Samples</Label>
                      <Input {...form.register('noOfSamples', { valueAsNumber: true })} type="number" placeholder="e.g., 1" />
                    </div>
                    <div>
                      <Label>Budget (INR)</Label>
                      <Input {...form.register('budget')} type="number" step="0.01" placeholder="e.g., 10000" />
                    </div>
                    <div>
                      <Label>Follow up</Label>
                      <Input {...form.register('followUp')} placeholder="Follow up notes / schedule" />
                    </div>
                    <div>
                      <Label>Sample Pick up from</Label>
                      <Input {...form.register('samplePickUpFrom')} placeholder="Pickup address" />
                    </div>
                    <div>
                      <Label>Delivery upto</Label>
                      <Input
                        {...form.register('deliveryUpTo')}
                        type="datetime-local"
                        disabled={!form.watch('sampleCollectionDate')}
                        min={form.watch('sampleCollectionDate') ? `${formatDateForInput(form.watch('sampleCollectionDate'))}T00:00` : undefined}
                        value={formatDatetimeForInput(form.watch('deliveryUpTo'))}
                        onChange={(e) => {
                          if (e.target.value) {
                            form.setValue('deliveryUpTo', parseLocalDatetime(e.target.value));
                          } else {
                            form.setValue('deliveryUpTo', null);
                          }
                        }}
                      />
                      {!form.watch('sampleCollectionDate') && (
                        <p className="text-xs text-amber-600 mt-1">Set Sample Collection Date first</p>
                      )}
                    </div>
                    <div>
                      <Label>Sample Shipped Date</Label>
                      <Input
                        type="date"
                        disabled={!form.watch('sampleCollectionDate')}
                        min={form.watch('sampleCollectionDate') ? formatDateForInput(form.watch('sampleCollectionDate')) : undefined}
                        {...form.register('sampleShippedDate')}
                        value={formatDateForInput(form.watch('sampleShippedDate'))}
                        onChange={(e) => {
                          if (e.target.value) {
                            form.setValue('sampleShippedDate', e.target.value ? new Date(e.target.value) : null);
                          } else {
                            form.setValue('sampleShippedDate', null);
                          }
                        }}
                      />
                      {!form.watch('sampleCollectionDate') && (
                        <p className="text-xs text-amber-600 mt-1">Set Sample Collection Date first</p>
                      )}
                    </div>
                    <div>
                      <Label>Sample Shipment Amount</Label>
                      <Input {...form.register('sampleShipmentAmount')} type="number" step="0.01" placeholder="e.g., 500" />
                    </div>
                    <div>
                      <Label>Sample Collected Date</Label>
                      <Input
                        type="date"
                        {...form.register('sampleCollectionDate')}
                        value={formatDateForInput(form.watch('sampleCollectionDate'))}
                      />
                    </div>
                    <div>
                      <Label>Sample Received Date</Label>
                      <Input
                        type="date"
                        disabled={!form.watch('sampleCollectionDate')}
                        min={form.watch('sampleCollectionDate') ? formatDateForInput(form.watch('sampleCollectionDate')) : undefined}
                        {...form.register('sampleReceivedDate')}
                        value={formatDateForInput(form.watch('sampleReceivedDate'))}
                        onChange={(e) => {
                          if (e.target.value) {
                            form.setValue('sampleReceivedDate', e.target.value ? new Date(e.target.value) : null);
                          } else {
                            form.setValue('sampleReceivedDate', null);
                          }
                        }}
                      />
                      {!form.watch('sampleCollectionDate') && (
                        <p className="text-xs text-amber-600 mt-1">Set Sample Collection Date first</p>
                      )}
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
                        <Input {...form.register('progenicsTrf')} placeholder="TRF reference" />
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={async (e) => {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;

                            // Validate file type
                            if (!f.type || !f.type.includes('pdf')) {
                              toast({ title: 'Error', description: 'Please select a PDF file', variant: 'destructive' });
                              return;
                            }

                            const fd = new FormData();
                            fd.append('file', f);
                            try {
                              // Use the new categorized upload API
                              const res = await fetch('/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=new', {
                                method: 'POST',
                                body: fd
                              });
                              if (res.ok) {
                                const data = await res.json();
                                // Store the file path from the new API response
                                form.setValue('progenicsTrf', data.filePath);
                                console.log('✅ File uploaded successfully:', {
                                  filePath: data.filePath,
                                  uploadId: data.uploadId,
                                  category: data.category,
                                  fileSize: data.fileSize
                                });
                                toast({
                                  title: 'Success',
                                  description: `TRF uploaded successfully to ${data.category} folder`
                                });
                              } else {
                                const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
                                toast({ title: 'Error', description: errorData.message || 'Failed to upload TRF', variant: 'destructive' });
                              }
                            } catch (err) {
                              const errorMessage = err instanceof Error ? err.message : 'Failed to upload TRF';
                              toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Phlebotomist Charges</Label>
                      <Input {...form.register('phlebotomistCharges')} type="number" step="0.01" placeholder="e.g., 200" />
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
                          <SelectItem value="WES+ Mito">WES+Mito</SelectItem>
                          <SelectItem value="CMA">CMA</SelectItem>
                          <SelectItem value="MLPA">MLPA</SelectItem>
                          <SelectItem value="NBS">NBS</SelectItem>
                          <SelectItem value="Karyotyping">Karyotyping</SelectItem>
                          <SelectItem value="Wellgenics">Wellgenics</SelectItem>
                          <SelectItem value="Sanger Clinical">Sanger Sequencing - Clinical</SelectItem>
                          <SelectItem value="Sanger Discovery">Sanger Sequencing - Discovery</SelectItem>
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

                {/* Section 5: Requirements & Remarks */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Requirements & Remarks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>Genetic Counsellor Required</Label>
                      <Select onValueChange={(value) => form.setValue('geneticCounselorRequired', value === 'yes')} defaultValue={form.getValues('geneticCounselorRequired') ? 'yes' : 'no'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nutrition Counsellor Required</Label>
                      <Select onValueChange={(value) => form.setValue('nutritionalCounsellingRequired', value === 'yes')} defaultValue={form.getValues('nutritionalCounsellingRequired') ? 'yes' : 'no'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <Label>Remarks</Label>
                      <Input {...form.register('remarkComment')} placeholder="Any additional remarks or comments" />
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
            <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto dialog-content">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>Edit existing lead details. Changes will be saved to the server.</DialogDescription>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">

                {/* Section 1: Lead Info */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Lead Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>Lead Type <span className="text-red-500">*</span></Label>
                      <Select onValueChange={(value) => { editForm.setValue('leadType', value); setEditSelectedLeadType(value); }} defaultValue={editSelectedLeadType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Test</SelectItem>
                          <SelectItem value="project">Project/Bulk Testing</SelectItem>
                          <SelectItem value="clinical_trial">Clinical Trial</SelectItem>
                          <SelectItem value="R&D">R&D</SelectItem>
                        </SelectContent>
                      </Select>
                      {editForm.formState.errors.leadType && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.leadType.message}</p>
                      )}
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
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sales / Responsible Person</Label>
                      <Select onValueChange={(value) => editForm.setValue('salesResponsiblePerson', value)} defaultValue={editForm.getValues('salesResponsiblePerson') || ''}>
                        <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SHIVA KUMAR Y M">SHIVA KUMAR Y M</SelectItem>
                          <SelectItem value="Vakumulu Srikanth">Vakumulu Srikanth</SelectItem>
                          <SelectItem value="Dr. Y Aruna Priya">Dr. Y Aruna Priya</SelectItem>
                          <SelectItem value="Dr Krishnasai Reddy">Dr Krishnasai Reddy</SelectItem>
                          <SelectItem value="S Karthik Iyer">S Karthik Iyer</SelectItem>
                          <SelectItem value="Dr. Swapnil Chandrakant Kajale">Dr. Swapnil Chandrakant Kajale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sample Type <span className="text-red-500">*</span></Label>
                      <Select onValueChange={(value) => {
                        if (value === 'custom') {
                          setShowCustomSampleType(true);
                          editForm.setValue('sampleType', '');
                        } else {
                          setShowCustomSampleType(false);
                          editForm.setValue('sampleType', value);
                        }
                      }} defaultValue={editForm.getValues('sampleType') || ''}>
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
                        <Input className="mt-2" placeholder="Enter sample type" onChange={(e) => editForm.setValue('sampleType', e.target.value)} defaultValue={editForm.getValues('sampleType') || ''} />
                      )}
                      {editForm.formState.errors.sampleType && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.sampleType.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Test Category</Label>
                      <Controller
                        name="testCategory"
                        control={editForm.control}
                        defaultValue={
                          editSelectedCategory === 'clinical' || editSelectedCategory === 'discovery'
                            ? editSelectedCategory
                            : 'clinical'
                        }
                        render={({ field }) => (
                          <Select value={field.value || editSelectedCategory} onValueChange={(value) => {
                            field.onChange(value);
                            setEditSelectedCategory(value);
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clinical">Clinical</SelectItem>
                              <SelectItem value="discovery">Discovery</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label>Amount Quoted (INR) <span className="text-red-500">*</span></Label>
                      <CurrencyInput value={editForm.watch('amountQuoted') as any} onValueChange={(v: any) => editForm.setValue('amountQuoted', v)} />
                      {editForm.formState.errors.amountQuoted && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.amountQuoted.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>TAT (Days)</Label>
                      <Input {...editForm.register('tat')} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Organization / Clinician */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Organization & Clinician</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>Organization / Hospital <span className="text-red-500">*</span></Label>
                      <Input {...editForm.register('organisationHospital')} placeholder="Hospital/Clinic Name" />
                      {editForm.formState.errors.organisationHospital && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.organisationHospital.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Name <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                        <Select
                          value={editSelectedTitle}
                          onValueChange={(value) => {
                            setEditSelectedTitle(value);
                            editForm.setValue('clinicianResearcherName', `${value} ${stripHonorific(editClinicianName)}`.trim());
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
                            editForm.setValue('clinicianResearcherName', `${editSelectedTitle} ${stripHonorific(e.target.value)}`.trim());
                          }}
                          placeholder="Name"
                          className="flex-1"
                        />
                      </div>
                      {editForm.formState.errors.clinicianResearcherName && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.clinicianResearcherName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Specialty</Label>
                      <Input {...editForm.register('speciality')} placeholder="Genetics, Oncology, etc." />
                    </div>
                    <div>
                      <Label>Clinician / Researcher Email <span className="text-red-500">*</span></Label>
                      <Input {...editForm.register('clinicianResearcherEmail')} placeholder="doctor@hospital.com" />
                      {editForm.formState.errors.clinicianResearcherEmail && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.clinicianResearcherEmail.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Phone <span className="text-red-500">*</span></Label>
                      <div className="phone-input-wrapper">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="IN"
                          value={formatToE164(editForm.watch('clinicianResearcherPhone')) || ''}
                          onChange={(value) => {
                            const phoneValue = value || '';
                            // Restrict to max digits (India: 10) and format to E.164
                            const restrictedValue = restrictPhoneInput(phoneValue, 'IN');
                            const formattedValue = formatToE164(restrictedValue);
                            editForm.setValue('clinicianResearcherPhone', formattedValue);
                            // Trigger validation
                            if (formattedValue) {
                              editForm.trigger('clinicianResearcherPhone');
                            }
                          }}
                          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                            // Handle paste events to ensure value is immediately truncated
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const restrictedValue = restrictPhoneInput(pastedText, 'IN');
                            const formattedValue = formatToE164(restrictedValue);
                            editForm.setValue('clinicianResearcherPhone', formattedValue);
                            if (formattedValue) {
                              editForm.trigger('clinicianResearcherPhone');
                            }
                          }}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {editForm.formState.errors.clinicianResearcherPhone && (
                        <p className="text-sm text-red-600 mt-1">{typeof editForm.formState.errors.clinicianResearcherPhone.message === 'string' ? editForm.formState.errors.clinicianResearcherPhone.message : 'Invalid phone number'}</p>
                      )}
                      {editForm.watch('clinicianResearcherPhone') && !editForm.formState.errors.clinicianResearcherPhone && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Valid phone number
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Clinician / Researcher Address</Label>
                      <Input {...editForm.register('clinicianResearcherAddress')} placeholder="Clinic / Hospital address" defaultValue={editForm.getValues('clinicianResearcherAddress')} />
                    </div>
                  </div>
                </div>

                {/* Section 3: Patient Details */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Patient Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>Patient / Client Name <span className="text-red-500">*</span></Label>
                      <Input {...editForm.register('patientClientName')} placeholder="Patient full name" />
                      {editForm.formState.errors.patientClientName && (
                        <p className="text-sm text-red-600 mt-1">{editForm.formState.errors.patientClientName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input {...editForm.register('age', { valueAsNumber: true })} type="number" placeholder="e.g., 35" />
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
                    <div>
                      <Label>Patient / Client Email</Label>
                      <Input {...editForm.register('patientClientEmail')} placeholder="patient@example.com" />
                    </div>
                    <div>
                      <Label>Patient / Client Phone <span className="text-red-500">*</span></Label>
                      <div className="phone-input-wrapper">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="IN"
                          value={formatToE164(editForm.watch('patientClientPhone')) || ''}
                          onChange={(value) => {
                            const phoneValue = value || '';
                            // Restrict to max digits (India: 10) and format to E.164
                            const restrictedValue = restrictPhoneInput(phoneValue, 'IN');
                            const formattedValue = formatToE164(restrictedValue);
                            editForm.setValue('patientClientPhone', formattedValue);
                            // Trigger validation
                            if (formattedValue) {
                              editForm.trigger('patientClientPhone');
                            }
                          }}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            // Prevent adding more digits if max reached
                            if (/\d/.test(e.key)) {
                              const currentValue = editForm.watch('patientClientPhone') || '';
                              const { canAdd } = canAddMoreDigits(currentValue, e.key);
                              if (!canAdd) {
                                e.preventDefault();
                              }
                            }
                          }}
                          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                            // Handle paste events to ensure value is immediately truncated
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const restrictedValue = restrictPhoneInput(pastedText, 'IN');
                            const formattedValue = formatToE164(restrictedValue);
                            editForm.setValue('patientClientPhone', formattedValue);
                            if (formattedValue) {
                              editForm.trigger('patientClientPhone');
                            }
                          }}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {editForm.formState.errors.patientClientPhone && (
                        <p className="text-sm text-red-600 mt-1">{typeof editForm.formState.errors.patientClientPhone.message === 'string' ? editForm.formState.errors.patientClientPhone.message : 'Invalid phone number'}</p>
                      )}
                      {editForm.watch('patientClientPhone') && !editForm.formState.errors.patientClientPhone && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Valid phone number
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Patient / Client Address</Label>
                      <Input
                        {...editForm.register('patientClientAddress')}
                        placeholder="Patient address"
                        value={editForm.watch('patientClientAddress') || ''}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Sample & Logistics */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Sample & Logistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>No of Samples</Label>
                      <Input {...editForm.register('noOfSamples', { valueAsNumber: true })} type="number" placeholder="e.g., 1" />
                    </div>
                    <div>
                      <Label>Budget (INR)</Label>
                      <Input {...editForm.register('budget')} type="number" step="0.01" placeholder="e.g., 10000" />
                    </div>
                    <div>
                      <Label>Follow up</Label>
                      <Input {...editForm.register('followUp')} placeholder="Follow up notes / schedule" />
                    </div>
                    <div>
                      <Label>Sample Pick up from</Label>
                      <Input {...editForm.register('samplePickUpFrom')} placeholder="Pickup address" />
                    </div>
                    <div>
                      <Label>Delivery upto</Label>
                      <Input
                        {...editForm.register('deliveryUpTo')}
                        type="datetime-local"
                        disabled={!editForm.watch('sampleCollectionDate')}
                        min={editForm.watch('sampleCollectionDate') ? `${formatDateForInput(editForm.watch('sampleCollectionDate'))}T00:00` : undefined}
                        value={formatDatetimeForInput(editForm.watch('deliveryUpTo'))}
                        onChange={(e) => {
                          if (e.target.value) {
                            editForm.setValue('deliveryUpTo', parseLocalDatetime(e.target.value));
                          } else {
                            editForm.setValue('deliveryUpTo', null);
                          }
                        }}
                      />
                      {!editForm.watch('sampleCollectionDate') && (
                        <p className="text-xs text-amber-600 mt-1">Set Sample Collection Date first</p>
                      )}
                    </div>
                    <div>
                      <Label>Sample Shipped Date</Label>
                      <Input
                        type="date"
                        disabled={!editForm.watch('sampleCollectionDate')}
                        min={editForm.watch('sampleCollectionDate') ? formatDateForInput(editForm.watch('sampleCollectionDate')) : undefined}
                        {...editForm.register('sampleShippedDate')}
                        value={formatDateForInput(editForm.watch('sampleShippedDate'))}
                        onChange={(e) => {
                          if (e.target.value) {
                            editForm.setValue('sampleShippedDate', e.target.value ? new Date(e.target.value) : null);
                          } else {
                            editForm.setValue('sampleShippedDate', null);
                          }
                        }}
                      />
                      {!editForm.watch('sampleCollectionDate') && (
                        <p className="text-xs text-amber-600 mt-1">Set Sample Collection Date first</p>
                      )}
                    </div>
                    <div>
                      <Label>Sample Shipment Amount</Label>
                      <Input {...editForm.register('sampleShipmentAmount')} type="number" step="0.01" placeholder="e.g., 500" />
                    </div>
                    <div>
                      <Label>Sample Collected Date</Label>
                      <Input
                        type="date"
                        {...editForm.register('sampleCollectionDate')}
                        value={formatDateForInput(editForm.watch('sampleCollectionDate'))}
                      />
                    </div>
                    <div>
                      <Label>Sample Received Date</Label>
                      <Input
                        type="date"
                        disabled={!editForm.watch('sampleCollectionDate')}
                        min={editForm.watch('sampleCollectionDate') ? formatDateForInput(editForm.watch('sampleCollectionDate')) : undefined}
                        {...editForm.register('sampleReceivedDate')}
                        value={formatDateForInput(editForm.watch('sampleReceivedDate'))}
                        onChange={(e) => {
                          if (e.target.value) {
                            editForm.setValue('sampleReceivedDate', e.target.value ? new Date(e.target.value) : null);
                          } else {
                            editForm.setValue('sampleReceivedDate', null);
                          }
                        }}
                      />
                      {!editForm.watch('sampleCollectionDate') && (
                        <p className="text-xs text-amber-600 mt-1">Set Sample Collection Date first</p>
                      )}
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
                        <Input {...editForm.register('progenicsTrf')} placeholder="TRF reference" />
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={async (e) => {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;

                            // Validate file type
                            if (!f.type || !f.type.includes('pdf')) {
                              toast({ title: 'Error', description: 'Please select a PDF file', variant: 'destructive' });
                              return;
                            }

                            const fd = new FormData();
                            fd.append('file', f);
                            const leadId = selectedLead?.id || 'new';
                            try {
                              const res = await fetch(`/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=${leadId}`, { method: 'POST', body: fd });
                              if (res.ok) {
                                const data = await res.json();
                                editForm.setValue('progenicsTrf', data.filePath);
                                toast({ title: 'Success', description: `TRF uploaded successfully to ${data.category} folder` });
                              } else {
                                const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
                                toast({ title: 'Error', description: errorData.message || 'Failed to upload TRF', variant: 'destructive' });
                              }
                            } catch (err) {
                              const errorMessage = err instanceof Error ? err.message : 'Failed to upload TRF';
                              toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Phlebotomist Charges</Label>
                      <Input {...editForm.register('phlebotomistCharges')} type="number" step="0.01" placeholder="e.g., 200" />
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
                          <SelectItem value="WES+ Mito">WES+Mito</SelectItem>
                          <SelectItem value="CMA">CMA</SelectItem>
                          <SelectItem value="MLPA">MLPA</SelectItem>
                          <SelectItem value="NBS">NBS</SelectItem>
                          <SelectItem value="Karyotyping">Karyotyping</SelectItem>
                          <SelectItem value="Wellgenics">Wellgenics</SelectItem>
                          <SelectItem value="Sanger Clinical">Sanger Sequencing - Clinical</SelectItem>
                          <SelectItem value="Sanger Discovery">Sanger Sequencing - Discovery</SelectItem>
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

                {/* Section 5: Requirements & Remarks */}
                <div className="border-b pb-6 form-section">
                  <h3 className="text-lg font-medium mb-4">Requirements & Remarks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-cols-form">
                    <div>
                      <Label>Genetic Counsellor Required</Label>
                      <Select onValueChange={(value) => editForm.setValue('geneticCounselorRequired', value === 'yes')} defaultValue={editForm.getValues('geneticCounselorRequired') ? 'yes' : 'no'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nutrition Counsellor Required</Label>
                      <Select onValueChange={(value) => editForm.setValue('nutritionalCounsellingRequired', value === 'yes')} defaultValue={editForm.getValues('nutritionalCounsellingRequired') ? 'yes' : 'no'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <Label>Remarks</Label>
                      <Input {...editForm.register('remarkComment')} placeholder="Any additional remarks or comments" />
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
          const hotCount = roleFilteredLeads.filter((l) => String(l.status) === 'hot').length;
          const convertedCount = roleFilteredLeads.filter((l) => String(l.status) === 'converted' || !!l.convertedAt).length;
          const totalCount = roleFilteredLeads.length;
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
        const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

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
                <div className="chart-container w-full flex flex-col lg:flex-row items-start gap-4 lg:gap-8">
                  {/* left: chart area - responsive mobile to desktop */}
                  <div ref={chartRef} className="chart-area w-full lg:w-3/5 h-72 sm:h-80 lg:h-96 relative pr-0 lg:pr-4">
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
                  {/* right: legend - responsive mobile to desktop */}
                  <div className="legend-container w-full lg:w-2/5 h-72 sm:h-80 lg:h-96 overflow-y-auto pl-0 lg:pl-8">
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
      {/* Revenue Stats Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="flex p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Projected Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white text-center break-words w-full mt-1">
                ₹{formatINR(leadsStats?.projectedRevenue ?? 0)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">Sum of Amount Quoted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="flex p-3 rounded-lg bg-green-50 dark:bg-green-900/20 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Actual Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white text-center break-words w-full mt-1">
                ₹{formatINR(leadsStats?.actualRevenue ?? 0)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">Sum of Budget</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Leads Table */}
      <Card>
        <CardContent className="p-0">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateRange={dateRange}
            setDateRange={setDateRange}
            dateFilterField={dateFilterField}
            setDateFilterField={setDateFilterField}
            dateFieldOptions={[
              { label: "Lead Created", value: "leadCreated" },
              { label: "Lead Modified", value: "leadModified" },
              { label: "Sample Collection Date", value: "sampleCollectionDate" },
              { label: "Sample Received Date", value: "sampleReceivedDate" },
              { label: "Sample Shipped Date", value: "sampleShippedDate" },
              { label: "Delivery Up To", value: "deliveryUpTo" },
            ]}
            totalItems={totalFiltered}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setPage}
            placeholder="Search Unique ID / Project ID / Patient Name / Phone..."
          />

          {/* Column Visibility Settings */}
          <div className="mt-2 mb-2 px-4">
            <ColumnSettings
              columns={leadColumns}
              isColumnVisible={leadColumnPrefs.isColumnVisible}
              toggleColumn={leadColumnPrefs.toggleColumn}
              resetToDefaults={leadColumnPrefs.resetToDefaults}
              showAllColumns={leadColumnPrefs.showAllColumns}
              showCompactView={leadColumnPrefs.showCompactView}
              visibleCount={leadColumnPrefs.visibleCount}
              totalCount={leadColumnPrefs.totalCount}
            />
          </div>

          <div className="border rounded-lg max-h-[60vh] overflow-x-auto leads-table-wrapper">
            <Table className="leads-table w-full">
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-30 border-b-2">
                <TableRow>
                  {leadColumnPrefs.isColumnVisible('uniqueId') && <TableHead onClick={() => { setSortKey('uniqueId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px] sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unique ID{sortKey === 'uniqueId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('projectId') && <TableHead onClick={() => { setSortKey('projectId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px] sticky left-[120px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Project ID{sortKey === 'projectId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('leadType') && <TableHead onClick={() => { setSortKey('leadType'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Lead Type{sortKey === 'leadType' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('status') && <TableHead onClick={() => { setSortKey('status'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Status{sortKey === 'status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('organisationHospital') && <TableHead onClick={() => { setSortKey('organisationHospital'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Organisation / Hospital{sortKey === 'organisationHospital' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('clinicianResearcherName') && <TableHead onClick={() => { setSortKey('clinicianResearcherName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Clinician / Researcher Name{sortKey === 'clinicianResearcherName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('speciality') && <TableHead onClick={() => { setSortKey('speciality'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Speciality{sortKey === 'speciality' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('clinicianResearcherEmail') && <TableHead onClick={() => { setSortKey('clinicianResearcherEmail'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Clinician / Researcher Email{sortKey === 'clinicianResearcherEmail' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('clinicianResearcherPhone') && <TableHead onClick={() => { setSortKey('clinicianResearcherPhone'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Clinician / Researcher Phone{sortKey === 'clinicianResearcherPhone' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('clinicianResearcherAddress') && <TableHead onClick={() => { setSortKey('clinicianResearcherAddress'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[140px]">Clinician / Researcher Address{sortKey === 'clinicianResearcherAddress' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('patientClientName') && <TableHead onClick={() => { setSortKey('patientClientName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Patient / Client Name{sortKey === 'patientClientName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('age') && <TableHead className="whitespace-nowrap font-semibold min-w-[200px]">Age</TableHead>}
                  {leadColumnPrefs.isColumnVisible('gender') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Gender</TableHead>}
                  {leadColumnPrefs.isColumnVisible('patientClientEmail') && <TableHead className="whitespace-nowrap font-semibold min-w-[80px]">Patient / Client Email</TableHead>}
                  {leadColumnPrefs.isColumnVisible('patientClientPhone') && <TableHead className="whitespace-nowrap font-semibold min-w-[100px]">Patient / Client Phone</TableHead>}
                  {leadColumnPrefs.isColumnVisible('patientClientAddress') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Patient / Client Address</TableHead>}
                  {leadColumnPrefs.isColumnVisible('geneticCounsellorRequired') && <TableHead onClick={() => { setSortKey('geneticCounsellorRequired'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Genetic Counselling Required{sortKey === 'geneticCounsellorRequired' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('nutritionalCounsellingRequired') && <TableHead className="whitespace-nowrap font-semibold min-w-[200px]">Nutritional Counselling Required</TableHead>}
                  {leadColumnPrefs.isColumnVisible('serviceName') && <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Service Name</TableHead>}
                  {leadColumnPrefs.isColumnVisible('amountQuoted') && <TableHead onClick={() => { setSortKey('amountQuoted'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Amount Quoted{sortKey === 'amountQuoted' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('tat') && <TableHead onClick={() => { setSortKey('tat'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">TAT(Days){sortKey === 'tat' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('sampleType') && <TableHead onClick={() => { setSortKey('sampleType'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Sample Type{sortKey === 'sampleType' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('noOfSamples') && <TableHead onClick={() => { setSortKey('noOfSamples'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">No of Samples{sortKey === 'noOfSamples' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('budget') && <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Budget</TableHead>}
                  {leadColumnPrefs.isColumnVisible('samplePickUpFrom') && <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Sample Pick up from</TableHead>}
                  {leadColumnPrefs.isColumnVisible('deliveryUpto') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Delivery upto</TableHead>}
                  {leadColumnPrefs.isColumnVisible('dateSampleCollected') && <TableHead onClick={() => { setSortKey('dateSampleCollected'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[160px]">Sample Collection Date{sortKey === 'dateSampleCollected' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('sampleShippedDate') && <TableHead className="whitespace-nowrap font-semibold min-w-[140px]">Sample Shipped Date</TableHead>}
                  {leadColumnPrefs.isColumnVisible('sampleShipmentAmount') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Sample Shipment Amount</TableHead>}
                  {leadColumnPrefs.isColumnVisible('trackingId') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Tracking ID</TableHead>}
                  {leadColumnPrefs.isColumnVisible('courierCompany') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Courier Company</TableHead>}
                  {leadColumnPrefs.isColumnVisible('sampleReceivedDate') && <TableHead onClick={() => { setSortKey('sampleReceivedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Sample Received Date{sortKey === 'sampleReceivedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('phlebotomistCharges') && <TableHead className="whitespace-nowrap font-semibold min-w-[140px]">Phlebotomist Charges</TableHead>}
                  {leadColumnPrefs.isColumnVisible('progenicsTrf') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Progenics TRF</TableHead>}
                  {leadColumnPrefs.isColumnVisible('followUp') && <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Follow up</TableHead>}
                  {leadColumnPrefs.isColumnVisible('leadCreatedBy') && <TableHead onClick={() => { setSortKey('leadCreatedBy'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[120px]">Lead Created By{sortKey === 'leadCreatedBy' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('salesResponsiblePerson') && <TableHead onClick={() => { setSortKey('salesResponsiblePerson'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[150px]">Sales / Responsible Person{sortKey === 'salesResponsiblePerson' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('leadCreated') && <TableHead onClick={() => { setSortKey('leadCreated'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Lead Created{sortKey === 'leadCreated' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('leadModified') && <TableHead onClick={() => { setSortKey('leadModified'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold min-w-[100px]">Lead Modified{sortKey === 'leadModified' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {leadColumnPrefs.isColumnVisible('remarkComment') && <TableHead className="whitespace-nowrap font-semibold min-w-[150px]">Remark / Comment</TableHead>}
                  {leadColumnPrefs.isColumnVisible('actions') && <TableHead className="actions-column whitespace-nowrap font-semibold min-w-[200px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={43} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : visibleLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={43} className="text-center py-8">No leads found</TableCell>
                  </TableRow>
                ) : (
                  visibleLeads.map((lead) => (
                    <TableRow key={lead.id} className={`${lead.status === 'converted' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} hover:bg-opacity-75 dark:hover:bg-opacity-75 cursor-pointer`}>
                      {leadColumnPrefs.isColumnVisible('uniqueId') && <TableCell className="whitespace-nowrap sticky left-0 z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{lead.uniqueId ?? lead.id ?? (lead as any)?._raw?.unique_id ?? (lead as any)?._raw?.uniqueId ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('projectId') && <TableCell className="whitespace-nowrap sticky left-[120px] z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{lead.projectId ?? (lead as any)?._raw?.project_id ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('leadType') && <TableCell className="whitespace-nowrap">
                        <Badge className={lead.leadType === 'project' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {lead.leadType || 'Individual'}
                        </Badge>
                      </TableCell>}
                      {leadColumnPrefs.isColumnVisible('status') && <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusBadgeColor(lead.status || 'quoted')}>
                          {lead.status || 'Quoted'}
                        </Badge>
                      </TableCell>}
                      {leadColumnPrefs.isColumnVisible('organisationHospital') && <TableCell className="whitespace-nowrap">{lead.organisationHospital ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('clinicianResearcherName') && <TableCell className="whitespace-nowrap">{lead.clinicianResearcherName ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('speciality') && <TableCell className="whitespace-nowrap">{lead.speciality ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('clinicianResearcherEmail') && <TableCell className="whitespace-nowrap">{lead.clinicianResearcherEmail ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('clinicianResearcherPhone') && <TableCell className="whitespace-nowrap">{lead.clinicianResearcherPhone ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('clinicianResearcherAddress') && <TableCell className="whitespace-nowrap">{lead.clinicianResearcherAddress ?? lead.clinicHospitalName ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('patientClientName') && <TableCell className="whitespace-nowrap">{lead.patientClientName ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('age') && <TableCell className="whitespace-nowrap">{lead.age != null ? String(lead.age) : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('gender') && <TableCell className="whitespace-nowrap">{lead.gender ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('patientClientEmail') && <TableCell className="whitespace-nowrap">{lead.patientClientEmail ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('patientClientPhone') && <TableCell className="whitespace-nowrap">{lead.patientClientPhone ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('patientClientAddress') && <TableCell className="whitespace-nowrap">{lead.patientClientAddress ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('geneticCounsellorRequired') && <TableCell className="whitespace-nowrap">{lead.geneticCounselorRequired ? 'Yes' : 'No'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('nutritionalCounsellingRequired') && <TableCell className="whitespace-nowrap">{lead.nutritionalCounsellingRequired ? 'Yes' : 'No'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('serviceName') && <TableCell className="whitespace-nowrap">{lead.serviceName ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('amountQuoted') && <TableCell className="whitespace-nowrap">{lead.amountQuoted != null ? `₹${formatINR(Number(lead.amountQuoted))}` : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('tat') && <TableCell className="whitespace-nowrap">{lead.tat != null ? String(lead.tat) : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('sampleType') && <TableCell className="whitespace-nowrap">{lead.sampleType ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('noOfSamples') && <TableCell className="whitespace-nowrap">{lead.noOfSamples != null ? String(lead.noOfSamples) : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('budget') && <TableCell className="whitespace-nowrap">{lead.budget != null ? `₹${formatINR(Number(lead.budget))}` : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('samplePickUpFrom') && <TableCell className="whitespace-nowrap">{lead.samplePickUpFrom ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('deliveryUpto') && <TableCell className="whitespace-nowrap">{lead.deliveryUpTo ? new Date(lead.deliveryUpTo).toLocaleDateString() : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('dateSampleCollected') && <TableCell className="whitespace-nowrap">{lead.sampleCollectionDate ? new Date(lead.sampleCollectionDate).toLocaleDateString() : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('sampleShippedDate') && <TableCell className="whitespace-nowrap">{lead.sampleShippedDate ? new Date(lead.sampleShippedDate).toLocaleDateString() : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('sampleShipmentAmount') && <TableCell className="whitespace-nowrap">{lead.sampleShipmentAmount != null ? `₹${formatINR(Number(lead.sampleShipmentAmount))}` : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('trackingId') && <TableCell className="whitespace-nowrap">{lead.trackingId ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('courierCompany') && <TableCell className="whitespace-nowrap">{lead.courierCompany ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('sampleReceivedDate') && <TableCell className="whitespace-nowrap">{lead.sampleReceivedDate ? new Date(lead.sampleReceivedDate).toLocaleDateString() : (lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : (lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '-'))}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('phlebotomistCharges') && <TableCell className="whitespace-nowrap">{lead.phlebotomistCharges != null ? `₹${formatINR(Number(lead.phlebotomistCharges))}` : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('progenicsTrf') && <TableCell className="whitespace-nowrap">
                        {lead.progenicsTrf ? <PDFViewer pdfUrl={lead.progenicsTrf} fileName="Progenics_TRF.pdf" /> : '-'}
                      </TableCell>}
                      {leadColumnPrefs.isColumnVisible('followUp') && <TableCell className="whitespace-nowrap">{lead.followUp ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('leadCreatedBy') && <TableCell className="whitespace-nowrap">{getUserNameById(lead.leadCreatedBy)}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('salesResponsiblePerson') && <TableCell className="whitespace-nowrap">{lead.salesResponsiblePerson ? (lead.salesResponsiblePerson.trim() || '-') : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('leadCreated') && <TableCell className="whitespace-nowrap">{lead.leadCreated ? new Date(lead.leadCreated).toLocaleString() : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('leadModified') && <TableCell className="whitespace-nowrap">{lead.leadModified ? new Date(lead.leadModified).toLocaleString() : '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('remarkComment') && <TableCell className="whitespace-nowrap">{(lead as any).remarkComment ?? (lead as any).remarks ?? (lead as any).remark ?? (lead as any).comments ?? '-'}</TableCell>}
                      {leadColumnPrefs.isColumnVisible('actions') && <TableCell className="actions-column">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 cursor-pointer flex-wrap">
                          <div className="flex gap-1 sm:gap-2">
                            {canEdit(lead) && (
                              <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)} className="cursor-pointer p-1 h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete() && (
                              <Button variant="ghost" size="sm" onClick={() => {
                                deleteConfirmation.confirmDelete({
                                  title: 'Delete Lead',
                                  description: `Are you sure you want to delete the lead for "${lead.patientClientName || lead.uniqueId}"? This action cannot be undone.`,
                                  onConfirm: () => {
                                    deleteLeadMutation.mutate({ id: lead.id });
                                    deleteConfirmation.hideConfirmation();
                                  }
                                });
                              }} className="p-1 h-8 w-8">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                          <Badge className={`${getStatusBadgeColor(lead.status || 'quoted')} whitespace-nowrap px-2 py-1 text-xs flex-shrink-0`}>
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
                                  className="text-xs px-1 py-0 h-7 whitespace-nowrap"
                                >
                                  {getNextStatus(lead.status || 'quoted') === 'cold' && '🔥 Cold'}
                                  {getNextStatus(lead.status || 'quoted') === 'hot' && '🔥 Hot'}
                                  {getNextStatus(lead.status || 'quoted') === 'won' && '✅ Won'}
                                </Button>
                              )}
                              {lead.status === 'won' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleConvertLead(lead.id)}
                                  disabled={convertLeadMutation.isPending}
                                  className="text-xs px-1 py-0 h-7 whitespace-nowrap"
                                >
                                  Convert
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* Pagination controls */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm">Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered}</div>
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} size="sm">Prev</Button>
            <div className="text-sm px-2 min-w-[60px] text-center">Page {page} / {totalPages}</div>
            <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} size="sm">Next</Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={deleteConfirmation.onOpenChange}
        title={deleteConfirmation.title}
        description={deleteConfirmation.description}
        confirmText={deleteConfirmation.confirmText}
        onConfirm={deleteConfirmation.onConfirm}
        type={deleteConfirmation.type}
        isLoading={deleteConfirmation.isLoading}
      />

      {/* Edit Confirmation Dialog */}
      <ConfirmationDialog
        open={editConfirmation.open}
        onOpenChange={editConfirmation.onOpenChange}
        title={editConfirmation.title}
        description={editConfirmation.description}
        confirmText={editConfirmation.confirmText}
        onConfirm={editConfirmation.onConfirm}
        type={editConfirmation.type}
        isLoading={editConfirmation.isLoading}
      />
    </div>
  );
}