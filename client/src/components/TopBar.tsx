import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationBell";
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  LogOut,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    // Unified Progenics branding for all roles
    return "bg-[#E6F6FD] text-[#0B1139] border border-blue-100";
  };

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 justify-between items-center">
          {/* Mobile menu button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-slate-500 hover:text-[#0085CA]"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0085CA] transition-colors" />
                <Input
                  type="search"
                  placeholder="Search samples, leads..."
                  className="pl-10 bg-slate-100/50 border-slate-200 focus:bg-white focus:border-[#0085CA] focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-slate-500 hover:text-[#0085CA] hover:bg-blue-50 rounded-full"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-xl transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-[#0085CA] text-white text-sm font-bold">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-bold text-[#0B1139] dark:text-white">
                      {user?.name}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-[10px] px-2 py-0.5 mt-0.5 font-medium rounded-md", getRoleBadgeColor(user?.role || ''))}
                    >
                      {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Unknown"}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 shadow-xl">
                <DropdownMenuItem className="focus:bg-blue-50 focus:text-[#0085CA] cursor-pointer rounded-lg m-1">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg m-1">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
