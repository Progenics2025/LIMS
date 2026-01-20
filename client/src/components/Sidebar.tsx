import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserPlus,
  TestTube,
  Microscope,
  IndianRupee,
  FileText,
  Users,
  Cpu,
  Trash2,
  Dna
} from "lucide-react";

// Define navigation items with ids so we can filter by role-specific allowed pages.
const navigation = [
  { id: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'leads', name: 'Lead Management', href: '/leads', icon: UserPlus },
  { id: 'process_master', name: 'Process Master', href: '/process-master', icon: FileText },
  { id: 'genetic', name: 'Genetic Counselling', href: '/genetic-counselling', icon: Users },
  { id: 'samples', name: 'Sample Tracking', href: '/samples', icon: TestTube },
  { id: 'finance', name: 'Finance', href: '/finance', icon: IndianRupee },
  { id: 'lab', name: 'Lab Processing', href: '/lab', icon: Microscope },
  { id: 'bioinformatics', name: 'Bioinformatics', href: '/bioinformatics', icon: Cpu },
  { id: 'nutrition', name: 'Nutrition', href: '/nutrition', icon: FileText },
  { id: 'reports', name: 'Reports', href: '/reports', icon: FileText },
  { id: 'admin', name: 'Admin Panel', href: '/admin', icon: Users },
  { id: 'recycle', name: 'Recycle bin', href: '/recycle-bin', icon: Trash2 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  // Prefer role from auth context user; fall back to a simple test variable if missing.
  // We normalize role strings to support different naming (spaces -> underscores).
  const { user } = useAuth() as any;
  const rawRole: string = user?.role ?? (typeof window !== 'undefined' ? (window as any).__USER_ROLE__ : undefined) ?? 'admin';
  const userRole = String(rawRole).toLowerCase().replace(/\s+/g, '_');

  // Explicit allowed pages per role according to requirements.
  const pagesByRole: Record<string, string[]> = {
    admin: ['dashboard', 'leads', 'process_master', 'samples', 'finance', 'lab', 'genetic', 'bioinformatics', 'nutrition', 'reports', 'recycle', 'admin'],
    manager: ['dashboard', 'leads', 'process_master', 'samples', 'finance', 'lab', 'genetic', 'bioinformatics', 'nutrition', 'reports', 'recycle'],
    operations: ['dashboard', 'leads', 'process_master', 'samples', 'finance', 'lab', 'genetic', 'bioinformatics', 'nutrition', 'reports', 'recycle', 'admin'],
    reporting: ['leads', 'finance', 'lab', 'genetic', 'bioinformatics', 'reports',],
    nutritionist: ['leads', 'reports', 'nutrition'],
    lab: ['leads', 'samples', 'lab'],
    genetic_counselling: ['leads', 'samples'],
    genetic: ['leads', 'samples'],
    sales: ['leads', 'samples', 'reports', 'genetic'],
    bioinformatics: ['leads', 'samples', 'lab'],
  };

  const allowedPages = pagesByRole[userRole] ?? pagesByRole['admin'];

  const filteredNavigation = navigation.filter(item => allowedPages.includes(item.id));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1139] text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header / Logo Area */}
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-none flex items-center justify-center shadow-lg relative overflow-hidden p-1">
            <img src="/favicon.png" alt="LIMS Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">Progenics</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">GENOMICS EXPERTISE</p>
          </div>
        </div>

        <nav className="flex-1 px-7 py-4 space-y-4 mt-4 overflow-y-auto">
          <p className="pl-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Module Access</p>
          {filteredNavigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-200 group cursor-pointer",
                    isActive
                      ? "bg-[#0085CA] text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                  onClick={() => onClose()}
                >
                  <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-[#090E32]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400 font-medium">Powered by Progenics</span>
          </div>
        </div>
      </div>
    </>
  );
}
