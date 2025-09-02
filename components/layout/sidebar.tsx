'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  FolderOpen,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = {
    student: [
      { name: 'Dashboard', href: '/student/dashboard', icon: Home },
      { name: 'My Projects', href: '/student/projects', icon: FolderOpen },
      { name: 'Events', href: '/student/events', icon: Calendar },
      { name: 'Submissions', href: '/student/submissions', icon: FileText },
    ],
    evaluator: [
      { name: 'Dashboard', href: '/evaluator/dashboard', icon: Home },
      { name: 'Submissions', href: '/evaluator/submissions', icon: FileText },
      { name: 'Pending Reviews', href: '/evaluator/pending', icon: Clock },
      { name: 'Completed', href: '/evaluator/completed', icon: CheckCircle },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { name: 'Events', href: '/admin/events', icon: Calendar },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Submissions', href: '/admin/submissions', icon: FileText },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ],
    super_admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { name: 'Events', href: '/admin/events', icon: Calendar },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Submissions', href: '/admin/submissions', icon: FileText },
      { name: 'Plagiarism', href: '/admin/plagiarism', icon: AlertTriangle },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  };

  const navItems = navigation[user?.role as keyof typeof navigation] || [];

  return (
    <div className={cn('flex flex-col w-64 bg-gray-50 border-r border-gray-200', className)}>
      {/* Logo Section */}
      <div className="flex items-center justify-center py-6 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">EL Portal</h2>
            <p className="text-xs text-gray-500">Learning Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                )}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm">
          <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  );
}