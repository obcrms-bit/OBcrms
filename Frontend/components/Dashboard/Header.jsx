'use client';

import { useCallback, useEffect, useState } from 'react';
import { User, Settings, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { branchAPI } from '@/services/api';
import KPICards from './KPICards';

export default function Header({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchError, setBranchError] = useState('');

  const loadBranches = useCallback(async () => {
    setLoadingBranches(true);
    setBranchError('');

    try {
      const response = await branchAPI.getBranches();
      const nextBranches = response.data?.data || [];
      setBranches(nextBranches);

      if (nextBranches.length) {
        const defaultBranch =
          nextBranches.find(
            (branch) =>
              String(branch._id || branch.id || '') ===
              String(user?.branchId?._id || user?.branchId || '')
          ) || nextBranches[0];

        setSelectedBranch(String(defaultBranch._id || defaultBranch.id || ''));
      } else {
        setSelectedBranch('');
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranches([]);
      setSelectedBranch('');
      setBranchError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to load branches.'
      );
    } finally {
      setLoadingBranches(false);
    }
  }, [user?.branchId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  return (
    <header className="bg-white shadow-sm border-b p-4 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold dark:text-white">
            Good Morning, {user?.name || 'User'}
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {currentTime.toLocaleTimeString()} IST
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {loadingBranches ? (
            <div className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500">
              Loading branches...
            </div>
          ) : null}

          {!loadingBranches && branches.length ? (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => {
                  const value = String(branch._id || branch.id || branch.name);
                  return (
                    <SelectItem key={value} value={value}>
                      {branch.name || 'Unnamed branch'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : null}

          {!loadingBranches && !branches.length ? (
            <div className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500">
              {branchError || 'No branches available'}
            </div>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <KPICards />
    </header>
  );
}
