"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Event, TrainingModule } from '@/types';
import ModuleForm from '@/components/admin/ModuleForm';
import AttendanceReports from '@/components/admin/AttendanceReports';
import Papa from 'papaparse';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/admin/MapPicker'), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>
});

function AdminDashboardContent() {
  const { user, isAdmin } = useAuth();
  const { users, trainingModules, userTrainings, assignTraining, departments, addDepartment, updateDepartment, deleteDepartment, eventTypes, addEventType, updateEventType, deleteEventType, updateUser, addUser, events, addEvent, updateEvent, deleteEvent, deleteTrainingModule, updateTrainingModule, addTrainingModule, peerVotes, supervisorScores, setSupervisorScore, employeesOfTheMonth, setEmployeeOfTheMonth, hotelLogo, setHotelLogo, updateHotelConfig, activityLogs, fetchActivityLogs, shifts, attendanceLogs, hotelConfig, fetchAttendanceLogs, addShift } = useData();
  const { t } = useLanguage();
  const { primaryColor, setPrimaryColor } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'Directory' | 'Hierarchy' | 'Training' | 'Departments' | 'Events' | 'Modules' | 'Recognition' | 'Attendance' | 'Activity' | 'Settings'>('Directory');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'Logs' | 'Reports'>('Logs');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const [selectedHierarchyDepts, setSelectedHierarchyDepts] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isDeptMultiSelectOpen, setIsDeptMultiSelectOpen] = useState(false);

  const renderHierarchyNode = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return null;

    const manager = users.find(u => u.id === dept.managerId);
    const deptUsers = users.filter(u => u.department === dept.name && u.id !== dept.managerId);
    
    // Anyone with a supervisor role OR anyone who HAS direct reports should be treated as a supervisor in the UI
    const supervisorRoles = ['Supervisor', 'Manager', 'HR Admin'];
    const supervisors = deptUsers.filter(u => supervisorRoles.includes(u.role) || users.some(other => other.supervisorId === u.id));
    
    // Staff who don't have a supervisor AND aren't supervisors themselves
    const staffWithoutSupervisor = deptUsers.filter(u => !u.supervisorId && !supervisors.some(s => s.id === u.id));
    
    const childDepartments = departments.filter(d => d.parentId === dept.id);

    return (
      <div key={dept.id} className="flex flex-col items-center relative">
        <div className="bg-slate-800 text-white px-6 py-2 rounded-t-lg font-semibold w-64 text-center shadow-md">
          {dept.name}
        </div>

        {/* Manager Node */}
        <div className="bg-primary-50 border-2 border-primary-200 w-64 p-4 rounded-b-lg shadow-sm flex flex-col items-center relative z-10">
          {manager ? (
            <>
              <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg mb-2 overflow-hidden">
                {manager.avatarUrl ? <img src={manager.avatarUrl} alt={manager.name} className="w-full h-full object-cover" /> : manager.name.charAt(0)}
              </div>
              <div className="font-medium text-slate-900 text-center">{manager.name}</div>
              <div className="text-xs text-primary-600 font-semibold mt-1">Supervisor</div>
            </>
          ) : (
            <div className="text-slate-400 italic py-4">{t('noSupervisorAssigned')}</div>
          )}
        </div>

        {/* Connection Line from Manager */}
        {(supervisors.length > 0 || staffWithoutSupervisor.length > 0 || childDepartments.length > 0) && (
          <div className="w-px h-8 bg-slate-300"></div>
        )}

        {/* Children Container (Supervisors, Direct Staff, Child Departments) */}
        <div className="flex space-x-4 relative">
          {/* Horizontal connecting line if multiple branches */}
          {(supervisors.length + (staffWithoutSupervisor.length > 0 ? 1 : 0) + childDepartments.length) > 1 && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-16rem)] h-px bg-slate-300"></div>
          )}

          {/* Child Departments */}
          {childDepartments.map(childDept => (
            <div key={childDept.id} className="flex flex-col items-center relative pt-4">
              <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-300"></div>
              {renderHierarchyNode(childDept.id)}
            </div>
          ))}

          {/* Supervisors */}
          {supervisors.map((supervisor, idx) => {
            const directReports = deptUsers.filter(u => u.supervisorId === supervisor.id);
            return (
              <div key={supervisor.id} className="flex flex-col items-center relative pt-4">
                <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-300"></div>
                <div className="bg-white border border-slate-200 w-48 p-3 rounded-lg shadow-sm flex flex-col items-center z-10">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mb-2 overflow-hidden">
                    {supervisor.avatarUrl ? <img src={supervisor.avatarUrl} alt={supervisor.name} className="w-full h-full object-cover" /> : supervisor.name.charAt(0)}
                  </div>
                  <div className="font-medium text-slate-800 text-sm text-center">{supervisor.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Supervisor</div>
                  {supervisor.area && <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded mt-1 text-slate-600">{supervisor.area}</div>}
                </div>

                {/* Direct Reports to Supervisor */}
                {directReports.length > 0 && (
                  <>
                    <div className="w-px h-6 bg-slate-300"></div>
                    <div className="flex flex-col space-y-2 relative">
                      {directReports.map(staff => (
                        <div key={staff.id} className="bg-slate-50 border border-slate-100 w-40 p-2 rounded shadow-sm flex items-center space-x-2 relative ml-4">
                          <div className="absolute -left-4 top-1/2 w-4 h-px bg-slate-300"></div>
                          <div className="absolute -left-4 top-0 bottom-1/2 w-px bg-slate-300"></div>
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs overflow-hidden">
                            {staff.avatarUrl ? <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" /> : staff.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-700 truncate">{staff.name}</div>
                            {staff.area && <div className="text-[9px] text-slate-400 truncate">{staff.area}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Staff reporting directly to Manager */}
          {staffWithoutSupervisor.length > 0 && (
            <div className="flex flex-col items-center relative pt-4">
              <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-300"></div>
              <div className="bg-slate-50 border border-slate-200 w-48 p-3 rounded-lg shadow-sm flex flex-col items-center z-10">
                <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Direct Reports</div>
                <div className="flex flex-col space-y-2 w-full">
                  {staffWithoutSupervisor.map(staff => (
                    <div key={staff.id} className="bg-white border border-slate-100 p-2 rounded shadow-sm flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs overflow-hidden">
                        {staff.avatarUrl ? <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" /> : staff.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{staff.name}</div>
                        {staff.area && <div className="text-[9px] text-slate-400 truncate">{staff.area}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Read tab from URL on mount and when searchParams change
  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = ['Directory', 'Hierarchy', 'Training', 'Departments', 'Events', 'Modules', 'Recognition', 'Attendance', 'Activity', 'Settings'];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'Activity') {
      fetchActivityLogs();
    }
    if (activeTab === 'Attendance') {
      fetchAttendanceLogs();
    }
  }, [activeTab]);

  // Edit/Add User State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<User> & { password?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV Upload State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<{ valid: any[], invalid: any[] }>({ valid: [], invalid: [] });

  // Department State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptParentId, setNewDeptParentId] = useState<string | null>(null);
  const [editingDept, setEditingDept] = useState<{ id: string, newName: string, managerId: string | null, parentId: string | null, areas: string } | null>(null);

  // Event Types State
  const [newEventTypeName, setNewEventTypeName] = useState('');
  const [editingEventType, setEditingEventType] = useState<{ id: string, newName: string } | null>(null);

  // Event State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editEventForm, setEditEventForm] = useState<Partial<Event>>({});

  // Learning Module State
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | undefined>(undefined);

  // Attendance/Shift State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [newShiftForm, setNewShiftForm] = useState({
    userId: '',
    startTime: '',
    endTime: '',
    type: 'Morning'
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) return null;

  const handleAssign = () => {
    if (selectedUser && selectedModule) {
      assignTraining(selectedUser, selectedModule);
      alert(t('trainingAssigned'));
      setSelectedUser(null);
      setSelectedModule(null);
    }
  };

  const handleEditUserClick = (u: User) => {
    setEditingUser(u);
    setEditUserForm(u);
    setIsUserModalOpen(true);
  };

  const handleAddUserClick = () => {
    setEditingUser(null);
    setEditUserForm({
      role: 'Staff',
      department: departments[0]?.name || '',
      birthday: '',
      hireDate: new Date().toISOString().split('T')[0],
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUser(editingUser.id, editUserForm);
    } else {
      if (editUserForm.name && editUserForm.email && editUserForm.role && editUserForm.department && editUserForm.birthday && editUserForm.hireDate) {
        addUser(editUserForm as Omit<User, 'id'>);
      } else {
        alert('Please fill in all required fields.');
        return;
      }
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
    setEditUserForm({});
  };

  const handleArrayInput = (field: keyof User, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setEditUserForm({ ...editUserForm, [field]: arrayValue });
  };

  const getArrayInputValue = (field: keyof User) => {
    const value = editUserForm[field];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return '';
  };

  const handleAddDepartment = () => {
    if (newDeptName.trim()) {
      addDepartment({ name: newDeptName.trim(), managerId: null, parentId: newDeptParentId, areas: [] });
      setNewDeptName('');
      setNewDeptParentId(null);
    }
  };

  const handleAddEventType = () => {
    if (newEventTypeName.trim()) {
      addEventType(newEventTypeName.trim());
      setNewEventTypeName('');
    }
  };

  const handleSaveEventType = () => {
    if (editingEventType && editingEventType.newName.trim()) {
      updateEventType(editingEventType.id, editingEventType.newName.trim());
      setEditingEventType(null);
    }
  };

  const handleSaveDepartment = () => {
    if (editingDept && editingDept.newName.trim()) {
      const areasArray = editingDept.areas.split(',').map(a => a.trim()).filter(a => a !== '');
      updateDepartment(editingDept.id, {
        name: editingDept.newName.trim(),
        managerId: editingDept.managerId,
        parentId: editingDept.parentId,
        areas: areasArray
      });
      setEditingDept(null);
    }
  };

  const handleAddEventClick = () => {
    setEditingEvent(null);
    setEditEventForm({
      type: 'Meeting',
      date: new Date().toISOString().split('T')[0],
    });
    setIsEventModalOpen(true);
  };

  const handleEditEventClick = (e: Event) => {
    setEditingEvent(e);
    setEditEventForm(e);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!editEventForm.title || !editEventForm.date || !editEventForm.type || !editEventForm.description) {
      alert(t('fillRequiredFields'));
      return;
    }

    const cleanTitle = editEventForm.title.trim();
    const eventToSave = { ...editEventForm, title: cleanTitle };

    if (editingEvent) {
      updateEvent(editingEvent.id, eventToSave);
    } else {
      addEvent(eventToSave as any);
    }

    setIsEventModalOpen(false);
    setEditingEvent(null);
    setEditEventForm({});
  };

  // Learning Module Handlers
  const handleAddModuleClick = () => {
    setEditingModule(undefined);
    setIsModuleFormOpen(true);
  };

  const handleEditModuleClick = (module: TrainingModule) => {
    setEditingModule(module);
    setIsModuleFormOpen(true);
  };

  const handleDeleteModule = (id: string) => {
    if (window.confirm(t('confirmDeleteModule'))) {
      deleteTrainingModule(id);
    }
  };

  const handleSubmitModule = (data: Omit<TrainingModule, 'id'>) => {
    if (editingModule) {
      updateTrainingModule(editingModule.id, data);
    } else {
      addTrainingModule(data);
    }
    setIsModuleFormOpen(false);
  };

  // Recognition Handlers
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [scoreInput, setScoreInput] = useState<{ [userId: string]: number }>({});

  const handleSaveScore = (userId: string) => {
    const score = scoreInput[userId];
    if (score !== undefined && score >= 0 && score <= 100 && user?.id) {
      setSupervisorScore({
        employeeId: userId,
        score: score,
        month: currentMonthStr
      }, user.id);
      alert('Score saved successfully!');
    } else {
      alert('Please enter a valid score between 0 and 100.');
    }
  };

  const calculateLeaderboard = () => {
    return users.map(u => {
      // 1. Trainings Completed (10 pts each)
      const completedTrainings = userTrainings.filter(ut => ut.userId === u.id && ut.status === 'Completed').length;
      const trainingPoints = completedTrainings * 10;

      // 2. Peer Votes (5 pts each)
      const votes = peerVotes.filter(v => v.nomineeId === u.id && v.month === currentMonthStr).length;
      const votePoints = votes * 5;

      // 3. Supervisor Score (1-100 pts)
      const supScoreRecord = supervisorScores.find(s => s.employeeId === u.id && s.month === currentMonthStr);
      const supScore = supScoreRecord ? supScoreRecord.score : 0;

      const totalPoints = trainingPoints + votePoints + supScore;

      return {
        user: u,
        completedTrainings,
        trainingPoints,
        votes,
        votePoints,
        supScore,
        totalPoints
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const leaderboard = calculateLeaderboard();
  const currentEotm = employeesOfTheMonth.find(e => e.month === currentMonthStr);

  const handleAwardEotm = (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres otorgar el premio de EDM a este usuario?')) {
      setEmployeeOfTheMonth({
        userId,
        month: currentMonthStr
      });
      alert('¡Premio de EDM otorgado con éxito!');
    }
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('invalidFileType'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t('fileTooLarge'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setHotelLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const newUsers = results.data as any[];
          const valid: any[] = [];
          const invalid: any[] = [];

          newUsers.forEach(userData => {
            if (userData.name && userData.email && userData.role && userData.department && userData.birthday && userData.hireDate) {
              valid.push(userData);
            } else {
              invalid.push(userData);
            }
          });

          setCsvPreviewData({ valid, invalid });
          setIsCsvModalOpen(true);

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert(t('csvUploadFormatError'));
        }
      });
    }
  };

  const handleConfirmCsvUpload = () => {
    let addedCount = 0;
    csvPreviewData.valid.forEach(userData => {
      // Find supervisor by email if provided
      let supervisorId = userData.supervisorId || null;
      if (userData.supervisorEmail) {
        const supervisor = users.find(u => u.email.toLowerCase() === userData.supervisorEmail.toLowerCase());
        if (supervisor) supervisorId = supervisor.id;
      }

      addUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role as any,
        department: userData.department,
        area: userData.area || '',
        supervisorId: supervisorId,
        birthday: userData.birthday,
        hireDate: userData.hireDate,
        avatarUrl: userData.avatarUrl || '',
        avatarFit: 'cover',
        tShirtSize: userData.tShirtSize as any || '',
        likes: userData.likes ? userData.likes.split(',').map((s: string) => s.trim()) : [],
        dislikes: userData.dislikes ? userData.dislikes.split(',').map((s: string) => s.trim()) : [],
        allergies: userData.allergies ? userData.allergies.split(',').map((s: string) => s.trim()) : [],
        isActive: true,
      } as any);
      addedCount++;
    });

    alert(t('csvUploadSuccess').replace('{count}', addedCount.toString()));
    setIsCsvModalOpen(false);
    setCsvPreviewData({ valid: [], invalid: [] });
  };

  const handleDownloadTemplate = () => {
    const headers = ['name', 'email', 'password', 'role', 'department', 'area', 'supervisorEmail', 'birthday', 'hireDate', 'tShirtSize', 'likes', 'dislikes', 'allergies'];
    const csvContent = headers.join(',') + '\n' +
      'John Doe,john@example.com,password123,Staff,Housekeeping,Cleaning,manager@example.com,1990-01-01,2023-01-01,M,"Coffee, Dogs","Loud noises",Peanuts';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users
    .filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = showActiveOnly ? (u.isActive !== false) : true;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const sortedDepartments = [...departments].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('hrCommandCenter')}</h1>
        <p className="text-slate-500 mt-2">{t('manageStaff')}</p>
      </header>

      {activeTab === 'Directory' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-slate-800">{t('staffDirectory')}</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('searchEmployees')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setShowActiveOnly(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${showActiveOnly ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t('active')}
                </button>
                <button
                  onClick={() => setShowActiveOnly(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!showActiveOnly ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t('all')}
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center whitespace-nowrap"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('uploadBatch')}
                </button>
                <button
                  onClick={handleAddUserClick}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors whitespace-nowrap"
                >
                  + {t('addEmployee')}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">{t('name')}</th>
                  <th className="p-4 font-semibold">{t('areas')}</th>
                  <th className="p-4 font-semibold">{t('hireDate')}</th>
                  <th className="p-4 font-semibold">{t('status')}</th>
                  <th className="p-4 font-semibold text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className={`w-8 h-8 rounded-full ${u.avatarFit === 'contain' ? 'object-contain bg-slate-100' : 'object-cover'}`}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{u.area || '-'}</td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{parseDate(u.hireDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {u.isActive !== false ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {t('active')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {t('inactive')}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEditUserClick(u)}
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        {t('edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">{t('csvUploadTitle')}</h2>
              <button
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvPreviewData({ valid: [], invalid: [] });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-4">{t('csvUploadDesc')}</p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('downloadTemplate')}
                  </button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload-modal"
                    />
                    <label
                      htmlFor="csv-upload-modal"
                      className="cursor-pointer px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {t('uploadCsv')}
                    </label>
                  </div>
                </div>
              </div>

              {(csvPreviewData.valid.length > 0 || csvPreviewData.invalid.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">{t('csvUploadPreview')}</h3>

                  {csvPreviewData.valid.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
                      <div className="p-3 bg-emerald-100 border-b border-emerald-200">
                        <h4 className="text-sm font-semibold text-emerald-800">
                          {t('csvUploadValidRows')} ({csvPreviewData.valid.length})
                        </h4>
                      </div>
                      <div className="overflow-x-auto max-h-60">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-emerald-50 sticky top-0">
                            <tr>
                              <th className="p-2 font-medium text-emerald-800">Name</th>
                              <th className="p-2 font-medium text-emerald-800">Email</th>
                              <th className="p-2 font-medium text-emerald-800">Role</th>
                              <th className="p-2 font-medium text-emerald-800">Department</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100">
                            {csvPreviewData.valid.map((row, i) => (
                              <tr key={i}>
                                <td className="p-2 text-emerald-900">{row.name}</td>
                                <td className="p-2 text-emerald-900">{row.email}</td>
                                <td className="p-2 text-emerald-900">{row.role}</td>
                                <td className="p-2 text-emerald-900">{row.department}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {csvPreviewData.invalid.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                      <div className="p-3 bg-red-100 border-b border-red-200">
                        <h4 className="text-sm font-semibold text-red-800">
                          {t('csvUploadInvalidRows')} ({csvPreviewData.invalid.length}) - {t('csvUploadMissingFields')}
                        </h4>
                      </div>
                      <div className="overflow-x-auto max-h-60">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-red-50 sticky top-0">
                            <tr>
                              <th className="p-2 font-medium text-red-800">Name</th>
                              <th className="p-2 font-medium text-red-800">Email</th>
                              <th className="p-2 font-medium text-red-800">Role</th>
                              <th className="p-2 font-medium text-red-800">Department</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-100">
                            {csvPreviewData.invalid.map((row, i) => (
                              <tr key={i}>
                                <td className="p-2 text-red-900">{row.name || '-'}</td>
                                <td className="p-2 text-red-900">{row.email || '-'}</td>
                                <td className="p-2 text-red-900">{row.role || '-'}</td>
                                <td className="p-2 text-red-900">{row.department || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setIsCsvModalOpen(false);
                        setCsvPreviewData({ valid: [], invalid: [] });
                      }}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    >
                      {t('csvUploadCancel')}
                    </button>
                    <button
                      onClick={handleConfirmCsvUpload}
                      disabled={csvPreviewData.valid.length === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('csvUploadConfirm')} ({csvPreviewData.valid.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editingUser ? t('editEmployee') : t('addEmployee')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={editUserForm.password || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select
                  required
                  value={editUserForm.role || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Staff">Staff</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Manager">Manager</option>
                  <option value="HR Admin">HR Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                <select
                  required
                  value={editUserForm.department || ''}
                  onChange={(e) => {
                    setEditUserForm({ ...editUserForm, department: e.target.value, area: '' });
                  }}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="" disabled>Select Department</option>
                  {sortedDepartments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              {editUserForm.department && departments.find(d => d.name === editUserForm.department)?.areas && departments.find(d => d.name === editUserForm.department)!.areas!.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                  <select
                    value={editUserForm.area || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, area: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Area (Optional)</option>
                    {[...(departments.find(d => d.name === editUserForm.department)?.areas || [])].sort((a, b) => a.localeCompare(b)).map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Birthday *</label>
                <input
                  type="date"
                  required
                  value={editUserForm.birthday || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, birthday: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hire Date *</label>
                <input
                  type="date"
                  required
                  value={editUserForm.hireDate || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, hireDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('manager')} (Supervisor)</label>
                <select
                  value={editUserForm.supervisorId || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, supervisorId: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">{t('chooseEmployee')}</option>
                  {users
                    .filter(sup => sup.id !== editingUser?.id && (sup.role === 'Supervisor' || sup.role === 'Manager' || sup.role === 'HR Admin'))
                    .map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name} ({sup.role})</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tShirtSize')}</label>
                <select
                  value={editUserForm.tShirtSize || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, tShirtSize: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">{t('selectSize')}</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('likes')} ({t('commaSeparated')})</label>
                <input
                  type="text"
                  value={getArrayInputValue('likes')}
                  onChange={(e) => handleArrayInput('likes', e.target.value)}
                  placeholder="e.g., Coffee, Dogs, Reading"
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dislikes')} ({t('commaSeparated')})</label>
                <input
                  type="text"
                  value={getArrayInputValue('dislikes')}
                  onChange={(e) => handleArrayInput('dislikes', e.target.value)}
                  placeholder="e.g., Loud noises, Spicy food"
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('allergies')} ({t('commaSeparated')})</label>
                <input
                  type="text"
                  value={getArrayInputValue('allergies')}
                  onChange={(e) => handleArrayInput('allergies', e.target.value)}
                  placeholder="e.g., Peanuts, Penicillin"
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editUserForm.isActive !== false}
                    onChange={(e) => {
                      const active = e.target.checked;
                      setEditUserForm({ 
                        ...editUserForm, 
                        isActive: active,
                        inactiveDate: active ? null : new Date().toISOString().split('T')[0],
                        inactiveReason: active ? null : editUserForm.inactiveReason || ''
                      });
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    {t('accountActive')}
                  </label>
                </div>

                {editUserForm.isActive === false && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <label className="block text-sm font-medium text-red-800 mb-1">{t('inactiveDate')} *</label>
                      <input
                        type="date"
                        required
                        value={editUserForm.inactiveDate || ''}
                        onChange={(e) => setEditUserForm({ ...editUserForm, inactiveDate: e.target.value })}
                        className="w-full border border-red-200 rounded-md shadow-sm p-2 text-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-800 mb-1">{t('inactiveReason')} *</label>
                      <select
                        required
                        value={editUserForm.inactiveReason || ''}
                        onChange={(e) => setEditUserForm({ ...editUserForm, inactiveReason: e.target.value })}
                        className="w-full border border-red-200 rounded-md shadow-sm p-2 text-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="" disabled>Seleccionar Motivo</option>
                        <option value="Fired">{t('reasonFired')}</option>
                        <option value="Quit">{t('reasonQuit')}</option>
                        <option value="Role change">{t('reasonRoleChange')}</option>
                        <option value="Other">{t('reasonOther')}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                  setEditUserForm({});
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                {editingUser ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Hierarchy' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 print:shadow-none print:border-none print:p-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0 print:hidden">
            <h2 className="text-xl font-semibold text-slate-800">{t('hierarchy')}</h2>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Multi-Department Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsDeptMultiSelectOpen(!isDeptMultiSelectOpen)}
                  className="flex items-center justify-between px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 min-w-[200px]"
                >
                  <span className="truncate">
                    {selectedHierarchyDepts.length === 0 
                      ? t('entireOrganization') 
                      : `${selectedHierarchyDepts.length} ${t('departments')}`}
                  </span>
                  <svg className="ml-2 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isDeptMultiSelectOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDeptMultiSelectOpen(false)}
                    ></div>
                    <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 max-h-60 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        <label className="flex items-center px-3 py-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedHierarchyDepts.length === 0}
                            onChange={() => setSelectedHierarchyDepts([])}
                            className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-slate-700">{t('entireOrganization')}</span>
                        </label>
                        <hr className="my-1 border-slate-100" />
                        {departments.map((dept) => (
                          <label key={dept.id} className="flex items-center px-3 py-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedHierarchyDepts.includes(dept.id)}
                              onChange={() => {
                                if (selectedHierarchyDepts.includes(dept.id)) {
                                  setSelectedHierarchyDepts(selectedHierarchyDepts.filter(id => id !== dept.id));
                                } else {
                                  setSelectedHierarchyDepts([...selectedHierarchyDepts, dept.id]);
                                }
                              }}
                              className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-3 text-sm text-slate-700">{dept.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.2, prev - 0.1))}
                  className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-white rounded transition-all"
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="px-2 flex items-center justify-center min-w-[3.5rem] text-xs font-bold text-slate-600">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                  className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-white rounded transition-all"
                  title="Zoom In"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="ml-1 p-1.5 text-slate-600 hover:text-primary-600 hover:bg-white rounded transition-all border-l border-slate-200"
                  title="Reset Zoom"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {t('print')}
              </button>
            </div>
          </div>

          <div className="overflow-auto pb-8 min-h-[400px] print:overflow-visible print:min-h-0 print:h-auto">
            <div 
              className="transition-transform duration-200 ease-out origin-top flex justify-center print-content"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <div className="flex space-x-8 min-w-max pb-32">
                {selectedHierarchyDepts.length > 0
                  ? selectedHierarchyDepts.map(deptId => renderHierarchyNode(deptId))
                  : (
                    <>
                      {departments.filter(d => !d.parentId).map(dept => renderHierarchyNode(dept.id))}
                      
                      {/* Users without a department */}
                      {users.filter(u => !u.department).length > 0 && (
                        <div className="flex flex-col items-center relative">
                          <div className="bg-slate-400 text-white px-6 py-2 rounded-t-lg font-semibold w-64 text-center shadow-md">
                            {t('notSpecified')} / No Dept
                          </div>
                          <div className="bg-slate-50 border-2 border-slate-200 w-64 p-4 rounded-b-lg shadow-sm flex flex-col items-center">
                            <div className="flex flex-col space-y-2 w-full">
                              {users.filter(u => !u.department).map(u => (
                                <div key={u.id} className="bg-white border border-slate-100 p-2 rounded shadow-sm flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs overflow-hidden">
                                    {u.avatarUrl ? <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                  </div>
                                  <div className="text-xs font-medium text-slate-700 truncate">{u.name}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )
                }
              </div>
            </div>
          </div>

          <style jsx global>{`
            @media print {
              /* Remove all layout-breaking wrappers for print */
              body, html {
                height: auto !important;
                overflow: visible !important;
                background: white !important;
              }

              /* Hide everything by default using a more targeted approach */
              aside, nav, header, footer,
              .no-print, .print\\:hidden,
              button, .border-b, .mb-6, h2 {
                display: none !important;
              }

              /* Ensure the main container and its ancestors are visible but clean */
              main, .flex-1, .flex-col, .space-y-8, .bg-white.rounded-xl.shadow-sm {
                display: block !important;
                position: static !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                overflow: visible !important;
                min-height: 0 !important;
              }

              /* The specific scroll container must be visible */
              .overflow-auto {
                overflow: visible !important;
                display: block !important;
              }

              /* Target the zoomable container specifically */
              .print-content {
                display: flex !important;
                justify-content: center !important;
                transform-origin: top center !important;
                /* Note: We DO NOT force transform: none here because we want to respect the user's zoomLevel from the style attribute */
              }

              /* Ensure tree nodes don't break across pages */
              .flex-col.items-center {
                page-break-inside: avoid !important;
              }
            }
          `}</style>
        </div>
      )}

      {activeTab === 'Training' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">{t('complianceOverview')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">{t('employees')}</th>
                    <th className="p-4 font-semibold">{t('module')}</th>
                    <th className="p-4 font-semibold">{t('status')}</th>
                    <th className="p-4 font-semibold">{t('completionDate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userTrainings.map((ut, idx) => {
                    const u = users.find(user => user.id === ut.userId);
                    const m = trainingModules.find(mod => mod.id === ut.moduleId);
                    if (!u || !m) return null;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-slate-900">{u.name}</td>
                        <td className="p-4 text-sm text-slate-600">{m.title}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ut.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            ut.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                            {ut.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {ut.completionDate ? new Date(ut.completionDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('assignTraining')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('selectEmployee')}</label>
                <select
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="" disabled>{t('chooseEmployee')}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('selectModule')}</label>
                <select
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={selectedModule || ''}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="" disabled>{t('chooseModule')}</option>
                  {trainingModules.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssign}
                disabled={!selectedUser || !selectedModule}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign Module
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Departments' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">{t('manageDepartments')}</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder={t('newDepartmentName')}
                className="border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
              <select
                value={newDeptParentId || ''}
                onChange={(e) => setNewDeptParentId(e.target.value || null)}
                className="border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No Parent (Top Level)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddDepartment}
                disabled={!newDeptName.trim()}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                + {t('add')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">{t('departmentName')}</th>
                  <th className="p-4 font-semibold">{t('parentDept')}</th>
                  <th className="p-4 font-semibold">{t('manager')}</th>
                  <th className="p-4 font-semibold">{t('areas')}</th>
                  <th className="p-4 font-semibold">{t('employees')}</th>
                  <th className="p-4 font-semibold text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map(dept => {
                  const employeeCount = users.filter(u => u.department === dept.name).length;
                  const isEditing = editingDept?.id === dept.id;

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingDept.newName}
                            onChange={(e) => setEditingDept({ ...editingDept, newName: e.target.value })}
                            className="border border-slate-300 rounded-md shadow-sm p-1 text-sm focus:ring-primary-500 focus:border-primary-500 w-full"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-900">{dept.name}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={editingDept.parentId || ''}
                            onChange={(e) => setEditingDept({ ...editingDept, parentId: e.target.value || null })}
                            className="border border-slate-300 rounded-md shadow-sm p-1 text-sm focus:ring-primary-500 focus:border-primary-500 w-full"
                          >
                            <option value="">None (Top Level)</option>
                            {departments.filter(d => d.id !== dept.id).map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">
                            {dept.parentId ? (departments.find(d => d.id === dept.parentId)?.name || 'None') : 'None'}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={editingDept.managerId || ''}
                            onChange={(e) => setEditingDept({ ...editingDept, managerId: e.target.value || null })}
                            className="border border-slate-300 rounded-md shadow-sm p-1 text-sm focus:ring-primary-500 focus:border-primary-500 w-full"
                          >
                            <option value="">{t('noManager')}</option>
                            {users.filter(u => u.department === dept.name).map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">
                            {dept.managerId ? users.find(u => u.id === dept.managerId)?.name || 'Unknown' : '-'}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingDept.areas}
                            onChange={(e) => setEditingDept({ ...editingDept, areas: e.target.value })}
                            placeholder="Comma separated areas"
                            className="border border-slate-300 rounded-md shadow-sm p-1 text-sm focus:ring-primary-500 focus:border-primary-500 w-full"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {dept.areas?.map(area => (
                              <span key={area} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600">{employeeCount}</td>
                      <td className="p-4 text-right space-x-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveDepartment}
                              className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingDept(null)}
                              className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingDept({ id: dept.id, newName: dept.name, managerId: dept.managerId || null, parentId: dept.parentId || null, areas: dept.areas?.join(', ') || '' })}
                              className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the ${dept.name} department?`)) {
                                  deleteDepartment(dept.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Events' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">Culture Hub Events</h2>
              <button
                onClick={handleAddEventClick}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                + Add Event
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Title</th>
                    <th className="p-4 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Location</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900">{e.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{e.description}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-600">{new Date(e.date).toLocaleDateString()}</p>
                        {e.time && <p className="text-xs text-slate-500">{e.time}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.type === 'Birthday' ? 'bg-pink-100 text-pink-800' :
                          e.type === 'Celebration' ? 'bg-yellow-100 text-yellow-800' :
                            e.type === 'Social' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                          }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{e.location || '-'}</td>
                      <td className="p-4 text-right space-x-3">
                        <button
                          onClick={() => handleEditEventClick(e)}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(t('confirmDelete'))) {
                              deleteEvent(e.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        {t('noEventsFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Event Types</h2>
                <p className="text-sm text-slate-500 mt-1">Manage the types of events available in the Culture Hub.</p>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newEventTypeName}
                  onChange={(e) => setNewEventTypeName(e.target.value)}
                  placeholder="New Event Type"
                  className="border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleAddEventType}
                  disabled={!newEventTypeName.trim()}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  + {t('add')}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {eventTypes.map(type => {
                  const isEditing = editingEventType?.id === type.id;
                  return (
                    <div key={type.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingEventType?.newName || ''}
                          onChange={(e) => editingEventType && setEditingEventType({ ...editingEventType, newName: e.target.value })}
                          className="border border-slate-300 rounded-md shadow-sm p-1 text-sm focus:ring-primary-500 focus:border-primary-500 flex-1 mr-2"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-slate-700">{type.name}</span>
                      )}
                      <div className="flex space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveEventType}
                              className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEventType(null)}
                              className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingEventType({ id: type.id, newName: type.name })}
                              className="text-primary-600 hover:text-primary-900 p-1"
                              title="Edit Event Type"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the event type "${type.name}"?`)) {
                                  deleteEventType(type.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete Event Type"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editingEvent ? t('editEvent') : t('addEvent')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('eventTitle')} *</label>
                <input
                  type="text"
                  required
                  value={editEventForm.title || ''}
                  onChange={(e) => setEditEventForm({ ...editEventForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('date')} *</label>
                <input
                  type="date"
                  required
                  value={editEventForm.date || ''}
                  onChange={(e) => setEditEventForm({ ...editEventForm, date: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('type')} *</label>
                <select
                  required
                  value={editEventForm.type || ''}
                  onChange={(e) => setEditEventForm({ ...editEventForm, type: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="" disabled>Select Type</option>
                  {eventTypes.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('time')}</label>
                <input
                  type="time"
                  value={editEventForm.time || ''}
                  onChange={(e) => setEditEventForm({ ...editEventForm, time: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('location')}</label>
                <input
                  type="text"
                  value={editEventForm.location || ''}
                  onChange={(e) => setEditEventForm({ ...editEventForm, location: e.target.value })}
                  placeholder="e.g., Conference Room A, Lobby"
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('description')} *</label>
                <textarea
                  required
                  rows={3}
                  value={editEventForm.description || ''}
                  onChange={(e) => setEditEventForm({ ...editEventForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsEventModalOpen(false);
                  setEditingEvent(null);
                  setEditEventForm({});
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEvent}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                {editingEvent ? t('saveChanges') : t('addEvent')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Modules Tab */}
      {activeTab === 'Modules' && (
        <div className="space-y-8">
          {isModuleFormOpen ? (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {editingModule ? t('editModule') : t('createNewModule')}
              </h2>
              <ModuleForm
                initialData={editingModule}
                onSubmit={handleSubmitModule}
                onCancel={() => setIsModuleFormOpen(false)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">{t('manageLearningModules')}</h2>
                <button
                  onClick={handleAddModuleClick}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  + {t('createNewModule')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('module')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('type')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('targetDepts')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('status')}
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">{t('actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {trainingModules.map((module) => (
                      <tr key={module.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{module.title}</span>
                            <span className="text-sm text-slate-500">{module.duration}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${module.type === 'Video' ? 'bg-blue-100 text-blue-800' :
                            module.type === 'Document' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                            {module.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {module.targetDepartments.map(dept => (
                              <span key={dept} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                {dept}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {module.required ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              {t('required')}
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                              {t('optional')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditModuleClick(module)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteModule(module.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {trainingModules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          {t('noModulesFound')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recognition Tab */}
      {activeTab === 'Recognition' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Tablero de EDM</h2>
              <p className="text-sm text-slate-500 mt-1">
                Puntos: Entrenamientos (10pts) + Votos de Compañeros (5pts) + Puntos del Supervisor (1-100pts)
              </p>
            </div>
            <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
              Mes Actual: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Posición</th>
                  <th className="p-4 font-semibold">{t('employees')}</th>
                  <th className="p-4 font-semibold text-center">Entrenamientos (x10)</th>
                  <th className="p-4 font-semibold text-center">Votos de Compañeros (x5)</th>
                  <th className="p-4 font-semibold text-center">Puntos del Supervisor</th>
                  <th className="p-4 font-semibold text-center">Puntaje Total</th>
                  <th className="p-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((entry, index) => (
                  <tr key={entry.user.id} className={`hover:bg-slate-50 transition-colors ${currentEotm?.userId === entry.user.id ? 'bg-amber-50' : ''}`}>
                    <td className="p-4 text-center font-bold text-slate-700">
                      #{index + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {entry.user.avatarUrl ? (
                          <img
                            src={entry.user.avatarUrl}
                            alt={entry.user.name}
                            className={`w-8 h-8 rounded-full ${entry.user.avatarFit === 'contain' ? 'object-contain bg-slate-100' : 'object-cover'}`}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                            {entry.user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {entry.user.name}
                            {currentEotm?.userId === entry.user.id && (
                              <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                GANADOR
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{entry.user.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm text-slate-600">
                      {entry.completedTrainings} <span className="text-xs text-slate-400">({entry.trainingPoints} pts)</span>
                    </td>
                    <td className="p-4 text-center text-sm text-slate-600">
                      {entry.votes} <span className="text-xs text-slate-400">({entry.votePoints} pts)</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scoreInput[entry.user.id] !== undefined ? scoreInput[entry.user.id] : entry.supScore}
                          onChange={(e) => setScoreInput({ ...scoreInput, [entry.user.id]: parseInt(e.target.value) || 0 })}
                          className="w-16 border border-slate-300 rounded-md shadow-sm p-1 text-sm text-center focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          onClick={() => handleSaveScore(entry.user.id)}
                          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded transition-colors"
                        >
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-primary-700 text-lg">
                      {entry.totalPoints}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleAwardEotm(entry.user.id)}
                        disabled={currentEotm?.userId === entry.user.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${currentEotm?.userId === entry.user.id
                          ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                      >
                        {currentEotm?.userId === entry.user.id ? t('awarded') : t('awardEotm')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Attendance & Scheduling Tab */}
      {activeTab === 'Attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex space-x-1 p-1 bg-slate-200/50 rounded-lg">
                <button
                  onClick={() => setAttendanceSubTab('Logs')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${attendanceSubTab === 'Logs' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Logs
                </button>
                <button
                  onClick={() => setAttendanceSubTab('Reports')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${attendanceSubTab === 'Reports' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Reports
                </button>
              </div>
              <button
                onClick={() => fetchAttendanceLogs()}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors shadow-sm"
              >
                Refresh
              </button>
            </div>

            {attendanceSubTab === 'Logs' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Time</th>
                      <th className="p-4 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Location</th>
                      <th className="p-4 font-semibold">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">No attendance logs found.</td>
                      </tr>
                    ) : (
                      attendanceLogs.map((log) => {
                        const logUser = users.find(u => u.id === log.user_id);
                        return (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 overflow-hidden">
                                  {logUser?.avatarUrl ? <img src={logUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">?</span>}
                                </div>
                                <span className="text-sm font-medium text-slate-900">{logUser?.name || 'Unknown User'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.type === 'CLOCK_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {log.type === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-500">
                              {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                            </td>
                            <td className="p-4">
                              {log.is_verified ? (
                                <span className="flex items-center text-emerald-600 text-xs font-bold">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="flex items-center text-rose-600 text-xs font-bold">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                  Out of Range
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <AttendanceReports />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Shift Management</h2>
              <button
                onClick={() => setIsShiftModalOpen(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 transition-all"
              >
                + Schedule Shift
              </button>
            </div>
            {/* Shift List could go here, for now keeping it simple */}
            <p className="text-sm text-slate-500 italic">Advanced shift calendar coming soon. You can currently schedule individual shifts for staff members.</p>
          </div>

          {/* New Shift Modal */}
          {isShiftModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-900">Schedule New Shift</h3>
                  <button onClick={() => setIsShiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
                    <select
                      value={newShiftForm.userId}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, userId: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select an employee...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={newShiftForm.startTime}
                        onChange={(e) => setNewShiftForm({ ...newShiftForm, startTime: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={newShiftForm.endTime}
                        onChange={(e) => setNewShiftForm({ ...newShiftForm, endTime: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Shift Type</label>
                    <select
                      value={newShiftForm.type}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, type: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Night">Night</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                  <button onClick={() => setIsShiftModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                  <button
                    onClick={async () => {
                      if (!newShiftForm.userId || !newShiftForm.startTime || !newShiftForm.endTime) return;
                      await addShift(newShiftForm as any);
                      setIsShiftModalOpen(false);
                      setNewShiftForm({ userId: '', startTime: '', endTime: '', type: 'Morning' });
                    }}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-all"
                  >
                    Save Shift
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'Activity' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{t('activityLog')}</h2>
              <p className="text-sm text-slate-500 mt-1">View a history of all changes made in the portal.</p>
            </div>
            <button
              onClick={() => fetchActivityLogs()}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Entity Type</th>
                  <th className="p-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-900">
                        {log.userName || 'System / Unknown'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-100 text-slate-800'
                          }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {log.entityType}
                      </td>
                      <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'Settings' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">Theme Settings</h2>
              <p className="text-sm text-slate-500 mt-1">Customize the appearance of the portal.</p>
            </div>
            <div className="p-6">
              <div className="max-w-md">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Primary Color</h3>
                <div className="flex space-x-4">
                  {(['indigo', 'blue', 'purple', 'rose', 'emerald'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                        }`}
                      style={{
                        backgroundColor:
                          color === 'indigo' ? '#6366f1' :
                            color === 'blue' ? '#3b82f6' :
                              color === 'purple' ? '#a855f7' :
                                color === 'rose' ? '#f43f5e' :
                                  '#10b981'
                      }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    >
                      {primaryColor === color && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">Branding</h2>
              <p className="text-sm text-slate-500 mt-1">Update the hotel logo displayed on the login screen.</p>
            </div>
            <div className="p-6">
              <div className="max-w-md">
                <label className="block text-sm font-medium text-slate-700 mb-3">Hotel Logo</label>
                <div className="flex items-center space-x-6">
                  <div className="h-24 w-24 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                    {hotelLogo ? (
                      <img src={hotelLogo} alt="Hotel Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-slate-500 mt-2">Recommended: PNG or SVG, max 5MB.</p>
                    {hotelLogo && (
                      <button
                        onClick={() => setHotelLogo(null)}
                        className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800">Geofencing & Attendance</h2>
                <p className="text-sm text-slate-500 mt-1">Configure hotel location for distance-based check-in verification.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Hotel Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={hotelConfig.hotelLatitude || ''}
                        onChange={(e) => updateHotelConfig({ hotelLatitude: parseFloat(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                        placeholder="e.g. 19.432608"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Hotel Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={hotelConfig.hotelLongitude || ''}
                        onChange={(e) => updateHotelConfig({ hotelLongitude: parseFloat(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                        placeholder="e.g. -99.133209"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Geofence Radius (meters)</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={hotelConfig.hotelGeofenceRadius || 200}
                          onChange={(e) => updateHotelConfig({ hotelGeofenceRadius: parseInt(e.target.value) })}
                          className="flex-1 border border-slate-200 rounded-lg p-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Clock-in Window (Minutes)</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={hotelConfig.clockInWindowMinutes || 30}
                          onChange={(e) => updateHotelConfig({ clockInWindowMinutes: parseInt(e.target.value) })}
                          className="w-24 border border-slate-200 rounded-lg p-2 text-sm"
                          min="0"
                        />
                        <span className="text-slate-500 text-sm">minutes</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 italic">
                        Allow staff to clock in within this many minutes before/after their scheduled shift.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Visual Location Picker</label>
                    <MapPicker
                      latitude={hotelConfig.hotelLatitude}
                      longitude={hotelConfig.hotelLongitude}
                      onLocationSelect={(lat, lng) => updateHotelConfig({ hotelLatitude: lat, hotelLongitude: lng })}
                    />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <p className="text-xs text-amber-800 flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Staff checking in outside this radius will be marked as "Out of Range" in reports. Settings are saved automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Admin Dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
