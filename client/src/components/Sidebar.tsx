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
  admin: ['dashboard','leads','process_master','samples','finance','lab','genetic','bioinformatics','nutrition','reports','recycle','admin'],
  manager: ['dashboard','leads','process_master','samples','finance','lab','genetic','bioinformatics','nutrition','reports','recycle','admin'],
  operations: ['dashboard','leads','process_master','samples','finance','lab','genetic','bioinformatics','nutrition','reports','recycle','admin'],
  reporting: ['dashboard','leads','finance','lab','genetic','bioinformatics','reports','recycle'],
  lab: ['dashboard','leads','samples','lab'],
  genetic_counselling: ['dashboard','leads','samples'],
  genetic: ['dashboard','leads','samples'],
  
  bioinformatics: ['dashboard','leads','samples','lab'],
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
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-center h-16 bg-primary-600 dark:bg-primary-700">
          <div className="flex items-center">
            <TestTube className="h-8 w-8 text-white mr-3" />
            <span className="text-white text-xl font-semibold">LIMS</span>
          </div>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      isActive
                        ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/50"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                    onClick={() => onClose()}
                  >
                    <Icon className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive
                        ? "text-primary-500 dark:text-primary-400"
                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                    )} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
