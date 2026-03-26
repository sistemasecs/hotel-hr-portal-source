"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Event, TrainingModule, EmployeeRequest } from '@/types';
import ModuleForm from '@/components/admin/ModuleForm';
import AttendanceReports from '@/components/admin/AttendanceReports';
import { calculateVacationBalance, getVacationHistory, getDurationInDays, getDaysSinceLastVacation, VacationYearBreakdown } from '@/lib/vacationUtils';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/admin/MapPicker'), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>
});

function AdminDashboardContent() {
  const { user, isAdmin } = useAuth();
  const { users, trainingModules, userTrainings, assignTraining, departments, addDepartment, updateDepartment, deleteDepartment, eventTypes, addEventType, updateEventType, deleteEventType, updateUser, addUser, events, addEvent, updateEvent, deleteEvent, deleteTrainingModule, updateTrainingModule, addTrainingModule, peerVotes, supervisorScores, setSupervisorScore, employeesOfTheMonth, setEmployeeOfTheMonth, hotelLogo, setHotelLogo, updateHotelConfig, activityLogs, fetchActivityLogs, shifts, attendanceLogs, hotelConfig, fetchAttendanceLogs, addShift } = useData();
  const { t, language } = useLanguage();
  const { primaryColor, setPrimaryColor } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'Directory' | 'Hierarchy' | 'Training' | 'Departments' | 'Events' | 'Modules' | 'Recognition' | 'Attendance' | 'Vacations' | 'Documents' | 'Activity' | 'Settings'>('Directory');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'Logs' | 'Reports'>('Logs');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const [selectedHierarchyDepts, setSelectedHierarchyDepts] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isDeptMultiSelectOpen, setIsDeptMultiSelectOpen] = useState(false);

  // Broadcast Notification State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      alert('Please fill out both title and message.');
      return;
    }

    if (!window.confirm('Are you sure you want to send this notification to ALL active employees?')) {
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcast: true,
          type: 'BROADCAST',
          title: broadcastTitle,
          message: broadcastMessage,
          link: '/dashboard/broadcasts'
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully sent broadcast to ${data.count} employees.`);
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        alert('Failed to send broadcast.');
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('An error occurred while sending the broadcast.');
    } finally {
      setIsBroadcasting(false);
    }
  };

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
    const validTabs = ['Directory', 'Hierarchy', 'Training', 'Departments', 'Events', 'Modules', 'Recognition', 'Attendance', 'Vacations', 'Documents', 'Activity', 'Settings'];
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Department State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptParentId, setNewDeptParentId] = useState<string | null>(null);
  const [editingDept, setEditingDept] = useState<{ id: string, newName: string, managerId: string | null, parentId: string | null, areas: string } | null>(null);

  // Event Types State
  const [newEventTypeName, setNewEventTypeName] = useState('');
  const [editingEventType, setEditingEventType] = useState<{ id: string, newName: string } | null>(null);

  const [allVacationRequests, setAllVacationRequests] = useState<EmployeeRequest[]>([]);
  const [yearlyDocuments, setYearlyDocuments] = useState<Record<string, any>>({});

  // Document Templates State
  const [documentTemplates, setDocumentTemplates] = useState<any[]>([]);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    requestType: 'Vacation',
    content: ''
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/document-templates');
      if (res.ok) {
        const data = await res.json();
        setDocumentTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'Documents') {
      fetchTemplates();
    }
  }, [activeTab]);
  const [vacationConsents, setVacationConsents] = useState<any[]>([]);

  const fetchVacationRequests = async () => {
    try {
      const res = await fetch('/api/requests/vacations');
      if (res.ok) {
        setAllVacationRequests(await res.json());
      }
    } catch (error) {
      console.error('Error fetching vacation requests:', error);
    }
  };

  const fetchVacationConsents = async () => {
    try {
      const res = await fetch('/api/vacations/consent');
      if (res.ok) {
        setVacationConsents(await res.json());
      }
    } catch (error) {
      console.error('Error fetching vacation consents:', error);
    }
  };

  const fetchYearlyDocuments = async () => {
    try {
      const res = await fetch('/api/requests/documents?type=YEARLY');
      if (res.ok) {
        const docs = await res.json();
        const mapping = docs.reduce((acc: any, doc: any) => {
          acc[doc.request_id] = doc;
          return acc;
        }, {});
        setYearlyDocuments(mapping);
      }
    } catch (error) {
      console.error('Error fetching yearly documents:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'Vacations') {
      fetchVacationRequests();
      fetchVacationConsents();
      fetchYearlyDocuments();
    }
  }, [activeTab]);

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
      setIsUserModalOpen(false);
      setEditingUser(null);
      setEditUserForm({});
      alert(t('employeeUpdated'));
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

  const handleSignConsent = async (targetUserId: string, yearNumber: number) => {
    try {
      const res = await fetch('/api/vacations/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          yearNumber,
          signedById: user?.id,
          notes: `Signed via Admin Dashboard - ${new Date().toLocaleDateString()}`
        })
      });

      if (res.ok) {
        fetchVacationConsents();
        // Also refresh yearly documents as signing might have triggered something or we want to update UI
        fetchYearlyDocuments();
        alert(t('consentSigned'));
      }
    } catch (error) {
      console.error('Failed to sign vacation consent:', error);
    }
  };

  const [viewingYearlyDoc, setViewingYearlyDoc] = useState<any | null>(null);

  const handleViewYearlyDocument = (userId: string, yearNumber: number) => {
    const docId = `YEARLY:${userId}:${yearNumber}`;
    const doc = yearlyDocuments[docId];
    if (doc) {
      setViewingYearlyDoc(doc);
    } else {
      alert("No summary document generated yet for this year.");
    }
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

  // Document Template Handlers
  const handleDownloadDefaultTemplate = () => {
    const defaultTemplate = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h1 style="text-align: center; color: #1a365d;">CONSENTIMIENTO DE VACACIONES / VACATION CONSENT</h1>
  <p style="text-align: right;"><strong>Fecha / Date:</strong> {{today}}</p>
  
  <p>Estimado/a <strong>{{userName}}</strong>,</p>
  
  <p>Por medio de la presente, se hace constar la aprobación de su solicitud de vacaciones para el periodo comprendido entre el <strong>{{startDate}}</strong> y el <strong>{{endDate}}</strong>.</p>
  
  <p>Al firmar este documento, usted declara estar de acuerdo con las fechas establecidas y se compromete a cumplir con las políticas de la empresa durante su ausencia. Su solicitud ha sido registrada bajo el folio <strong>#{{requestId}}</strong> para el departamento de <strong>{{department}}</strong>.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />
  
  <div style="margin-top: 50px; text-align: center;">
    <div style="display: inline-block; width: 300px; border-top: 1px solid #333; padding-top: 5px;">
      Firma del Empleado / Employee Signature
    </div>
  </div>
</div>
    `.trim();

    const blob = new Blob([defaultTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'default_vacation_template.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      alert('Name and Content are required');
      return;
    }

    try {
      const url = editingTemplate 
        ? `/api/document-templates/${editingTemplate.id}` 
        : '/api/document-templates';
      
      const res = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      if (res.ok) {
        setIsDocumentModalOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', requestType: 'Vacation', content: '' });
        fetchTemplates();
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/document-templates/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.getWorksheet(1);
      
      if (!sheet) {
        throw new Error("No worksheet found");
      }

      const valid: any[] = [];
      const invalid: any[] = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const name = row.getCell(1).text;
        const email = row.getCell(2).text;
        const role = row.getCell(3).text;
        const department = row.getCell(4).text;
        const area = row.getCell(5).text;
        
        let birthday = '';
        const bdayCell = row.getCell(6);
        if (bdayCell.type === ExcelJS.ValueType.Date && bdayCell.value instanceof Date) {
          birthday = bdayCell.value.toISOString().split('T')[0];
        } else {
          birthday = bdayCell.text;
        }

        let hireDate = '';
        const hireCell = row.getCell(7);
        if (hireCell.type === ExcelJS.ValueType.Date && hireCell.value instanceof Date) {
          hireDate = hireCell.value.toISOString().split('T')[0];
        } else {
          hireDate = hireCell.text;
        }

        const userData = {
          name, email, role, department, area, birthday, hireDate,
          id: Math.random().toString(36).substr(2, 9)
        };

        if (name && email && role && department && birthday && hireDate) {
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
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert(t('csvUploadFormatError') || 'Error parsing the Excel file. Please ensure it is a valid .xlsx file.');
    }
  };

  const handleEditCsvRow = (id: string, field: string, value: string, type: 'valid' | 'invalid') => {
    const list = [...csvPreviewData[type]];
    const rowIndex = list.findIndex(r => r.id === id);
    if (rowIndex === -1) return;

    list[rowIndex] = { ...list[rowIndex], [field]: value };
    
    // Re-validate all data to move between valid/invalid if needed
    const allData = [...csvPreviewData.valid, ...csvPreviewData.invalid];
    const itemToUpdate = allData.find(d => d.id === id);
    if (itemToUpdate) {
      Object.assign(itemToUpdate, { [field]: value });
    }

    const newValid: any[] = [];
    const newInvalid: any[] = [];

    allData.forEach(userData => {
      if (userData.name && userData.email && userData.role && userData.department && userData.birthday && userData.hireDate) {
        newValid.push(userData);
      } else {
        newInvalid.push(userData);
      }
    });

    setCsvPreviewData({ valid: newValid, invalid: newInvalid });
  };

  const handleDeleteCsvRow = (id: string, type: 'valid' | 'invalid') => {
    const newList = csvPreviewData[type].filter(r => r.id !== id);
    setCsvPreviewData({ ...csvPreviewData, [type]: newList });
  };

  const handleConfirmCsvUpload = async () => {
    if (csvPreviewData.valid.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: csvPreviewData.valid.length });

    let addedCount = 0;
    let failedCount = 0;
    
    for (const userData of csvPreviewData.valid) {
      try {
        // Find supervisor by email if provided
        let supervisorId = userData.supervisorId || null;
        if (userData.supervisorEmail) {
          const supervisor = users.find(u => u.email.toLowerCase() === userData.supervisorEmail.toLowerCase());
          if (supervisor) supervisorId = supervisor.id;
        }

        const success = await addUser({
          name: userData.name,
          email: userData.email,
          password: userData.password || 'Welcome123',
          role: userData.role as any,
          department: userData.department,
          area: userData.area || '',
          supervisorId: supervisorId,
          birthday: userData.birthday,
          hireDate: userData.hireDate,
          avatarUrl: userData.avatarUrl || '',
          avatarFit: 'cover',
          tShirtSize: userData.tShirtSize as any || '',
          likes: userData.likes ? (typeof userData.likes === 'string' ? userData.likes.split(',').map((s: string) => s.trim()) : userData.likes) : [],
          dislikes: userData.dislikes ? (typeof userData.dislikes === 'string' ? userData.dislikes.split(',').map((s: string) => s.trim()) : userData.dislikes) : [],
          allergies: userData.allergies ? (typeof userData.allergies === 'string' ? userData.allergies.split(',').map((s: string) => s.trim()) : userData.allergies) : [],
          isActive: true,
        } as any);
        
        if (success) {
          addedCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error('Failed to add user during batch upload:', err);
        failedCount++;
      }
      
      setUploadProgress(prev => ({ ...prev, current: addedCount + failedCount }));
    }

    setIsUploading(false);
    if (failedCount > 0) {
      alert(`${addedCount} users added successfully. ${failedCount} failed. Please check the logs.`);
    } else {
      alert(t('csvUploadSuccess').replace('{count}', addedCount.toString()));
    }
    setIsCsvModalOpen(false);
    setCsvPreviewData({ valid: [], invalid: [] });
    setUploadProgress({ current: 0, total: 0 });
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Employee Import');

    const headers = ['Name', 'Email', 'Role', 'Department', 'Area', 'Birthday (YYYY-MM-DD)', 'HireDate (YYYY-MM-DD)'];
    sheet.addRow(headers);

    // Style the header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    // Set column widths
    sheet.columns = [
      { key: 'name', width: 25 },
      { key: 'email', width: 30 },
      { key: 'role', width: 20 },
      { key: 'department', width: 25 },
      { key: 'area', width: 20 },
      { key: 'birthday', width: 25 },
      { key: 'hireDate', width: 25 },
    ];

    const listsSheet = workbook.addWorksheet('Lists');
    listsSheet.state = 'hidden';

    const roles = ['Staff', 'Supervisor', 'Manager', 'HR Admin'];
    roles.forEach((r, i) => listsSheet.getCell(`A${i + 1}`).value = r);

    const deptNames = departments.map(d => d.name).filter(Boolean);
    deptNames.forEach((d, i) => listsSheet.getCell(`B${i + 1}`).value = d);

    const allAreas = Array.from(new Set(departments.flatMap(d => d.areas || []))).filter(Boolean);
    allAreas.forEach((a, i) => listsSheet.getCell(`C${i + 1}`).value = a);

    for (let i = 2; i <= 100; i++) {
      sheet.getCell(`C${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Lists!$A$1:$A$${roles.length}`],
        showErrorMessage: true,
        errorTitle: 'Invalid Role',
        error: 'Please select from the dropdown.'
      };

      if (deptNames.length > 0) {
        sheet.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Lists!$B$1:$B$${deptNames.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Department',
          error: 'Please select from the dropdown.'
        };
      }

      if (allAreas.length > 0) {
        sheet.getCell(`E${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Lists!$C$1:$C$${allAreas.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Area',
          error: 'Please select from the dropdown.'
        };
      }
    }

    sheet.addRow(['Juan Perez', 'juan@example.com', roles[0], deptNames[0] || '', allAreas[0] || '', '1990-01-01', '2023-01-01']);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'employee_import_template.xlsx');
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
            <div className="flex items-baseline space-x-3">
              <h2 className="text-xl font-semibold text-slate-800">{t('staffDirectory')}</h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredUsers.length} {t('totalStaff')}
              </span>
            </div>
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
                  <th className="p-4 font-semibold">{language === 'es' ? 'Emergencia' : 'Emergency'}</th>
                  <th className="p-4 font-semibold">{t('vacations')}</th>
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
                      {u.emergencyContactName ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{u.emergencyContactName}</span>
                          <span className="text-xs text-slate-500">{u.emergencyContactPhone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const userRequests = allVacationRequests.filter(r => r.userId === u.id);
                        const { accrued, balance } = calculateVacationBalance(u.hireDate, userRequests);
                        return (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{balance} {t('days')}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('accrued')}: {accrued}</span>
                          </div>
                        );
                      })()}
                    </td>
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
                      accept=".xlsx"
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
                      <div className="p-3 bg-emerald-100 border-b border-emerald-200 flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-emerald-800">
                          {t('csvUploadValidRows')} ({csvPreviewData.valid.length})
                        </h4>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-200/50 px-2 py-0.5 rounded">Listo para subir</span>
                      </div>
                      <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-emerald-50 sticky top-0 z-10 border-b border-emerald-100">
                            <tr>
                              <th className="p-3 font-bold text-emerald-800 uppercase text-[10px]">Name</th>
                              <th className="p-3 font-bold text-emerald-800 uppercase text-[10px]">Email</th>
                              <th className="p-3 font-bold text-emerald-800 uppercase text-[10px]">Role</th>
                              <th className="p-3 font-bold text-emerald-800 uppercase text-[10px]">Department</th>
                              <th className="p-3 font-bold text-emerald-800 uppercase text-[10px] text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100">
                            {csvPreviewData.valid.map((row) => (
                              <tr key={row.id} className="hover:bg-white/50 transition-colors">
                                <td className="p-2">
                                  <input 
                                    disabled={isUploading}
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded px-1 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.name} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'name', e.target.value, 'valid')}
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    disabled={isUploading}
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded px-1 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.email} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'email', e.target.value, 'valid')}
                                  />
                                </td>
                                <td className="p-2">
                                  <select 
                                    disabled={isUploading}
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded px-1 text-sm appearance-none ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.role} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'role', e.target.value, 'valid')}
                                  >
                                    <option value="Staff">Staff</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Manager">Manager</option>
                                    <option value="HR Admin">HR Admin</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <select 
                                    disabled={isUploading}
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded px-1 text-sm appearance-none ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.department} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'department', e.target.value, 'valid')}
                                  >
                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                  </select>
                                </td>
                                <td className="p-2 text-right">
                                  <button 
                                    disabled={isUploading}
                                    onClick={() => handleDeleteCsvRow(row.id, 'valid')} 
                                    className={`p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {csvPreviewData.invalid.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg overflow-hidden">
                      <div className="p-3 bg-rose-100 border-b border-rose-200 flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-rose-800">
                          {t('csvUploadInvalidRows')} ({csvPreviewData.invalid.length})
                        </h4>
                        <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider bg-rose-200/50 px-2 py-0.5 rounded">Faltan datos obligatorios</span>
                      </div>
                      <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-rose-50 sticky top-0 z-10 border-b border-rose-100">
                            <tr>
                              <th className="p-3 font-bold text-rose-800 uppercase text-[10px]">Name</th>
                              <th className="p-3 font-bold text-rose-800 uppercase text-[10px]">Email</th>
                              <th className="p-3 font-bold text-rose-800 uppercase text-[10px]">Role</th>
                              <th className="p-3 font-bold text-rose-800 uppercase text-[10px]">Department</th>
                              <th className="p-3 font-bold text-rose-800 uppercase text-[10px] text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-100">
                            {csvPreviewData.invalid.map((row) => (
                              <tr key={row.id} className="hover:bg-white/50 transition-colors">
                                <td className="p-2">
                                  <input 
                                    disabled={isUploading}
                                    placeholder="Missing Name"
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-rose-500 rounded px-1 transition-all ${!row.name ? 'placeholder-rose-300' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.name || ''} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'name', e.target.value, 'invalid')}
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    disabled={isUploading}
                                    placeholder="Missing Email"
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-rose-500 rounded px-1 ${!row.email ? 'placeholder-rose-300' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.email || ''} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'email', e.target.value, 'invalid')}
                                  />
                                </td>
                                <td className="p-2">
                                  <select 
                                    disabled={isUploading}
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-rose-500 rounded px-1 text-sm appearance-none ${!row.role ? 'text-rose-300' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.role || ''} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'role', e.target.value, 'invalid')}
                                  >
                                    <option value="">Select Role</option>
                                    <option value="Staff">Staff</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Manager">Manager</option>
                                    <option value="HR Admin">HR Admin</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <select 
                                    disabled={isUploading}
                                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-rose-500 rounded px-1 text-sm appearance-none ${!row.department ? 'text-rose-300' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    value={row.department || ''} 
                                    onChange={(e) => handleEditCsvRow(row.id, 'department', e.target.value, 'invalid')}
                                  >
                                    <option value="">Select Dept</option>
                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                  </select>
                                </td>
                                <td className="p-2 text-right">
                                  <button 
                                    disabled={isUploading}
                                    onClick={() => handleDeleteCsvRow(row.id, 'invalid')} 
                                    className={`p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-2 bg-rose-200/30 text-[10px] text-rose-700 italic px-4">
                        * Completa todos los campos obligatorios para activar la fila.
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                        <span>{t('csvUploadingProgress')}...</span>
                        <span>{uploadProgress.current} / {uploadProgress.total}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                    <button
                      disabled={isUploading}
                      onClick={() => {
                        setIsCsvModalOpen(false);
                        setCsvPreviewData({ valid: [], invalid: [] });
                      }}
                      className={`px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      disabled={csvPreviewData.valid.length === 0 || isUploading}
                      onClick={handleConfirmCsvUpload}
                      className={`px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold shadow-sm flex items-center space-x-2 ${
                        (csvPreviewData.valid.length === 0 || isUploading) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>{t('uploading')}...</span>
                        </>
                      ) : (
                        <span>{t('acceptUpload')}</span>
                      )}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Contacto de Emergencia' : 'Emergency Contact Name'}</label>
                <input
                  type="text"
                  value={editUserForm.emergencyContactName || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, emergencyContactName: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Tel. Emergencia' : 'Emergency Phone'}</label>
                <input
                  type="text"
                  value={editUserForm.emergencyContactPhone || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, emergencyContactPhone: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'NIT' : 'Tax ID'}</label>
                <input
                  type="text"
                  value={editUserForm.taxId || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, taxId: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Estado Civil' : 'Marital Status'}</label>
                <select
                  value={editUserForm.maritalStatus || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, maritalStatus: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">N/A</option>
                  <option value="Single">{language === 'es' ? 'Soltero/a' : 'Single'}</option>
                  <option value="Married">{language === 'es' ? 'Casado/a' : 'Married'}</option>
                  <option value="Divorced">{language === 'es' ? 'Divorciado/a' : 'Divorced'}</option>
                  <option value="Widowed">{language === 'es' ? 'Viudo/a' : 'Widowed'}</option>
                </select>
              </div>
              {editUserForm.maritalStatus === 'Married' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Nombre Cónyuge' : 'Spouse Name'}</label>
                  <input
                    type="text"
                    value={editUserForm.spouseName || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, spouseName: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Hijos' : 'Children Count'}</label>
                <input
                  type="number"
                  min="0"
                  value={editUserForm.childrenCount ?? 0}
                  onChange={(e) => setEditUserForm({ ...editUserForm, childrenCount: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
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

              {editingUser && (
                <div className="md:col-span-2 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{language === 'es' ? 'Documentos' : 'Documents'}</h3>
                  <div className="flex flex-wrap gap-4">
                    {editingUser.healthCardUrl ? <a href={editingUser.healthCardUrl} target="_blank" rel="noreferrer" className="text-primary-600 font-medium text-xs hover:underline flex items-center bg-primary-50 px-2 py-1 rounded-md"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Tarjeta Salud</a> : <span className="text-slate-400 text-xs border border-dashed border-slate-300 px-2 py-1 rounded bg-slate-50">No Tarjeta Salud</span>}
                    {(editingUser.department === 'Alimentos y Bebidas' || editingUser.department === 'Food & Beverage') && (
                      editingUser.foodHandlingCardUrl ? <a href={editingUser.foodHandlingCardUrl} target="_blank" rel="noreferrer" className="text-primary-600 font-medium text-xs hover:underline flex items-center bg-primary-50 px-2 py-1 rounded-md"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Tarjeta Manipulación</a> : <span className="text-slate-400 text-xs border border-dashed border-slate-300 px-2 py-1 rounded bg-slate-50">No Tarj. Manipulación</span>
                    )}
                    {editingUser.criminalRecordUrl ? <a href={editingUser.criminalRecordUrl} target="_blank" rel="noreferrer" className="text-primary-600 font-medium text-xs hover:underline flex items-center bg-primary-50 px-2 py-1 rounded-md"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Ant. Penales</a> : <span className="text-slate-400 text-xs border border-dashed border-slate-300 px-2 py-1 rounded bg-slate-50">No Ant. Penales</span>}
                    {editingUser.policeRecordUrl ? <a href={editingUser.policeRecordUrl} target="_blank" rel="noreferrer" className="text-primary-600 font-medium text-xs hover:underline flex items-center bg-primary-50 px-2 py-1 rounded-md"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Ant. Policiacos</a> : <span className="text-slate-400 text-xs border border-dashed border-slate-300 px-2 py-1 rounded bg-slate-50">No Ant. Policiacos</span>}
                  </div>
                </div>
              )}

              {editingUser && (
                <div className="md:col-span-2 mt-6 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('vacationTracking')}
                    </h3>
                    {(() => {
                      const userRequests = allVacationRequests.filter(r => r.userId === editingUser.id);
                      const { balance } = calculateVacationBalance(editingUser.hireDate, userRequests);
                      return (
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
                          {balance} {t('days')} {t('remaining')}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {t('yearlyBreakdown')}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-200">
                          <tr className="text-slate-500 text-[10px] uppercase">
                            <th className="px-4 py-2">{t('year')}</th>
                            <th className="px-4 py-2">{t('period')}</th>
                            <th className="px-4 py-2 text-center">{t('accrued')}</th>
                            <th className="px-4 py-2 text-center">{t('taken')}</th>
                            <th className="px-4 py-2 text-center font-bold">{t('balance')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {getVacationHistory(editingUser.hireDate, allVacationRequests.filter(r => r.userId === editingUser.id)).map((year) => (
                            <tr key={year.yearNumber} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-medium">#{year.yearNumber}</td>
                              <td className="px-4 py-2 text-slate-500 text-xs">
                                {new Date(year.periodStart).toLocaleDateString()} - {new Date(year.periodEnd).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-center">{year.accrued}</td>
                              <td className="px-4 py-2 text-center">{year.taken}</td>
                              <td className="px-4 py-2 text-center font-bold text-primary-600">{year.remaining}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('vacations')}</div>
                    {allVacationRequests.filter(r => r.userId === editingUser.id && r.status === 'Approved').length === 0 ? (
                      <div className="text-sm text-slate-400 italic py-2">{t('noVacationsTaken')}</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allVacationRequests
                          .filter(r => r.userId === editingUser.id && r.status === 'Approved')
                          .sort((a, b) => new Date(b.data.startDate).getTime() - new Date(a.data.startDate).getTime())
                          .map(r => (
                            <div key={r.id} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-900">
                                  {new Date(r.data.startDate).toLocaleDateString()} - {new Date(r.data.endDate).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                  {getDurationInDays(r.data.startDate, r.data.endDate)} {t('days')}
                                </span>
                              </div>
                              {r.data.reason && <p className="text-[11px] text-slate-500 italic truncate italic">"{r.data.reason}"</p>}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                width: auto !important;
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
                width: auto !important;
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
                width: auto !important;
              }

              /* Target the zoomable container specifically */
              .print-content {
                display: flex !important;
                justify-content: center !important;
                transform-origin: top center !important;
                min-width: max-content !important;
                width: auto !important;
                /* Note: We DO NOT force transform: none here because we want to respect the user's zoomLevel from the style attribute */
              }

              /* Ensure tree nodes don't break across pages and don't squash */
              .flex-col.items-center {
                page-break-inside: avoid !important;
                flex-shrink: 0 !important;
              }

              /* Specific fix for the flex container wrapping the nodes */
              .flex.space-x-8.min-w-max {
                min-width: max-content !important;
                flex-shrink: 0 !important;
              }
            }
          `}</style>
        </div>
      )}

      {activeTab === 'Training' && (
        <div className="space-y-8">
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

          <div className="border-t border-slate-100 pt-8">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {module.targetDepartments?.length > 0 ? (
                                module.targetDepartments.map(deptName => (
                                  <span key={deptName} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                    {deptName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">{t('all')}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${module.required ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                              {module.required ? t('requiredTraining') : t('optional')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditModuleClick(module)}
                                className="text-primary-600 hover:text-primary-900 p-1"
                                title={t('edit')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteModule(module.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title={t('delete')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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

      {/* Vacation Management Tab */}
      {activeTab === 'Vacations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t('vacationManagement')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Staff Overview */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('staffOverview')}</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredUsers.map(u => {
                    const userRequests = allVacationRequests.filter(r => r.userId === u.id);
                    const { balance } = calculateVacationBalance(u.hireDate, userRequests);
                    const daysSince = getDaysSinceLastVacation(userRequests);
                    const history = getVacationHistory(u.hireDate, userRequests);

                    return (
                      <div key={u.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-primary-600">{balance} {t('days')}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                              {t('lastVacationEnded')}: {daysSince !== null ? `${daysSince} ${t('daysAgo')}` : t('never')}
                            </p>
                          </div>
                        </div>

                        {/* Consent Forms for this user */}
                        <div className="mt-4 border-t border-slate-200 pt-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t('consentForms')}</p>
                          <div className="space-y-2">
                            {history.map(year => {
                              const isSigned = vacationConsents.some(c => c.user_id === u.id && c.year_number === year.yearNumber);
                              return (
                                <div key={year.yearNumber} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100">
                                  <div className="text-xs">
                                    <span className="font-medium text-slate-700">{t('employmentYear')} {year.yearNumber}</span>
                                    <span className="text-slate-400 ml-2">({year.periodStart} - {year.periodEnd})</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {(yearlyDocuments[`YEARLY:${u.id}:${year.yearNumber}`]) && (
                                      <button
                                        onClick={() => handleViewYearlyDocument(u.id, year.yearNumber)}
                                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors underline uppercase"
                                      >
                                        {t('viewSummary') || 'View Summary'}
                                      </button>
                                    )}
                                    {isSigned ? (
                                      <span className="flex items-center text-[10px] font-bold text-emerald-600">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('consentSigned').toUpperCase()}
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleSignConsent(u.id, year.yearNumber)}
                                        className="text-[10px] font-bold text-primary-600 hover:text-primary-800 transition-colors underline uppercase"
                                      >
                                        {t('signConsent')}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vacation Calendar */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-fit">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('vacations')} Calendar
                </h3>
                <div className="space-y-4">
                  {/* Reuse the calendar logic from Culture Hub or similar if needed, 
                      for now showing a list of upcoming approved vacations as a simple placeholder calendar view */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    {allVacationRequests
                      .filter(r => r.status === 'Approved')
                      .sort((a, b) => new Date(a.data.startDate).getTime() - new Date(b.data.startDate).getTime())
                      .slice(0, 10)
                      .map(r => (
                        <div key={r.id} className="p-3 flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-lg flex flex-col items-center justify-center border border-primary-100">
                            <span className="text-[10px] font-bold text-primary-600 uppercase">
                              {new Date(r.data.startDate).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-lg font-black text-primary-700 leading-none">
                              {new Date(r.data.startDate).getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{r.userName || 'Employee'}</p>
                            <p className="text-[10px] text-slate-500">
                              {r.data.startDate} → {r.data.endDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    {allVacationRequests.filter(r => r.status === 'Approved').length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-sm">No vacations scheduled</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden text-slate-900">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{t('documentTemplates')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('manageTemplatesDesc')}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadDefaultTemplate}
                  className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {t('downloadDefaultTemplate')}
                </button>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({ name: '', requestType: 'Vacation', content: '' });
                    setIsDocumentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  + {t('addTemplate')}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">{t('templateTitle')}</th>
                    <th className="p-4 font-semibold">{t('type')}</th>
                    <th className="p-4 font-semibold">{language === 'es' ? 'ACTUALIZADO' : 'UPDATED'}</th>
                    <th className="p-4 font-semibold text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documentTemplates.map(template => (
                    <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900">{template.name}</td>
                      <td className="p-4 text-sm text-slate-600">{template.requestType}</td>
                      <td className="p-4 text-sm text-slate-500">{new Date(template.updatedAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right space-x-3">
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateForm({
                              name: template.name,
                              requestType: template.requestType,
                              content: template.content
                            });
                            setIsDocumentModalOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documentTemplates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                        No templates found. Click "+ {t('addTemplate')}" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Document Template Modal */}
      {isDocumentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">{editingTemplate ? t('editTemplate') : t('addTemplate')}</h2>
              <button onClick={() => setIsDocumentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('title')}</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500 text-slate-900"
                  placeholder="e.g. Vacation Approval Consent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('type')}</label>
                <select
                  value={templateForm.requestType}
                  onChange={e => setTemplateForm({ ...templateForm, requestType: e.target.value })}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500 text-slate-900"
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Absence">Absence</option>
                  <option value="Permit">Permit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('templateContent')}</label>
                <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  {t('placeholdersHint')}
                </div>
                <textarea
                  value={templateForm.content}
                  onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })}
                  rows={12}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm font-mono focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter document content with placeholders..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsDocumentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                >
                  {editingTemplate ? t('updateTemplate') : t('createTemplate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'Activity' && (
        <div className="space-y-6">
          {/* Broadcast Announcement Card */}
          <div className="bg-slate-900 text-white rounded-xl shadow-lg overflow-hidden border border-slate-800">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Broadcast Announcement</h2>
                  <p className="text-slate-400 text-sm">Send a mass notification to all active employees immediately.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Title / Subject</label>
                  <input 
                    type="text" 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Important HR Update"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Message Content</label>
                  <textarea 
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type the announcement here..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleSendBroadcast}
                    disabled={isBroadcasting || !broadcastTitle || !broadcastMessage}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all shadow-lg flex items-center space-x-2"
                  >
                    {isBroadcasting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Send Announcement</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

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
        )}

        {/* Yearly Document Viewer Modal */}
        {viewingYearlyDoc && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">
                  {t('employmentYear')} {viewingYearlyDoc.request_id.split(':').pop()} - {t('vacationManagement')}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {t('downloadPdfPrint')}
                  </button>
                  <button 
                    onClick={() => setViewingYearlyDoc(null)}
                    className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-slate-100/30">
                <div 
                  className="bg-white shadow-sm border border-slate-200 p-12 mx-auto max-w-[210mm] min-h-[297mm] prose prose-slate"
                  dangerouslySetInnerHTML={{ __html: viewingYearlyDoc.content }}
                />
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
