"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Event, TrainingModule } from '@/types';
import ModuleForm from '@/components/admin/ModuleForm';
import Papa from 'papaparse';

function AdminDashboardContent() {
  const { user, isAdmin } = useAuth();
  const { users, trainingModules, userTrainings, assignTraining, departments, addDepartment, updateDepartment, deleteDepartment, eventTypes, addEventType, deleteEventType, updateUser, addUser, events, addEvent, updateEvent, deleteEvent, deleteTrainingModule, updateTrainingModule, addTrainingModule, peerVotes, supervisorScores, setSupervisorScore, employeesOfTheMonth, setEmployeeOfTheMonth, hotelLogo, setHotelLogo } = useData();
  const { t } = useLanguage();
  const { primaryColor, setPrimaryColor } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'Directory' | 'Training' | 'Departments' | 'Events' | 'Modules' | 'Recognition' | 'Settings'>('Directory');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Read tab from URL on mount and when searchParams change
  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = ['Directory', 'Training', 'Departments', 'Events', 'Modules', 'Recognition', 'Settings'];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Edit/Add User State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<User> & { password?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Department State
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<{oldName: string, newName: string} | null>(null);

  // Event Types State
  const [newEventTypeName, setNewEventTypeName] = useState('');

  // Event State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editEventForm, setEditEventForm] = useState<Partial<Event>>({});

  // Learning Module State
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | undefined>(undefined);

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
      department: departments[0] || '',
      birthday: '',
      hireDate: new Date().toISOString().split('T')[0],
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUser(editingUser.id, editUserForm);
    } else {
      if (editUserForm.name && editUserForm.email && editUserForm.password && editUserForm.role && editUserForm.department && editUserForm.birthday && editUserForm.hireDate) {
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
      addDepartment(newDeptName.trim());
      setNewDeptName('');
    }
  };

  const handleAddEventType = () => {
    if (newEventTypeName.trim()) {
      addEventType(newEventTypeName.trim());
      setNewEventTypeName('');
    }
  };

  const handleSaveDepartment = () => {
    if (editingDept && editingDept.newName.trim()) {
      updateDepartment(editingDept.oldName, editingDept.newName.trim());
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

    // Generate ID based on title + month + year
    const [y, m, d] = editEventForm.date.split('-');
    const localDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const monthYear = localDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Create a URL-friendly ID: "summer-party-july-2026"
    const generatedId = `${cleanTitle}-${monthYear}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
      .replace(/(^-|-$)/g, ''); // remove leading/trailing hyphens

    const eventToSave = { ...editEventForm, title: cleanTitle };

    if (editingEvent) {
      updateEvent(editingEvent.id, eventToSave);
    } else {
      addEvent({ ...eventToSave, id: generatedId } as Event);
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
    if (score !== undefined && score >= 0 && score <= 100) {
      setSupervisorScore({
        employeeId: userId,
        score: score,
        month: currentMonthStr
      });
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
    if (window.confirm('Are you sure you want to award Employee of the Month to this user?')) {
      setEmployeeOfTheMonth({
        userId,
        month: currentMonthStr
      });
      alert('Employee of the Month awarded successfully!');
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
          let addedCount = 0;
          let errorCount = 0;

          newUsers.forEach(userData => {
            if (userData.name && userData.email && userData.password && userData.role && userData.department && userData.birthday && userData.hireDate) {
              addUser({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role as any,
                department: userData.department,
                birthday: userData.birthday,
                hireDate: userData.hireDate,
                avatarUrl: userData.avatarUrl || '',
                avatarFit: 'cover',
                tShirtSize: userData.tShirtSize as any || '',
                likes: userData.likes ? userData.likes.split(',').map((s: string) => s.trim()) : [],
                dislikes: userData.dislikes ? userData.dislikes.split(',').map((s: string) => s.trim()) : [],
                allergies: userData.allergies ? userData.allergies.split(',').map((s: string) => s.trim()) : [],
              });
              addedCount++;
            } else {
              errorCount++;
            }
          });

          alert(`Successfully added ${addedCount} employees. ${errorCount > 0 ? `Failed to add ${errorCount} employees due to missing required fields.` : ''}`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file. Please check the format.');
        }
      });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('hrCommandCenter')}</h1>
          <p className="text-slate-500 mt-2">{t('manageStaff')}</p>
        </div>
        <div className="flex space-x-2">
          {['Directory', 'Training', 'Departments', 'Events', 'Modules', 'Recognition', 'Settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab === 'Directory' ? t('staffDirectory') : 
               tab === 'Training' ? t('complianceOverview') : 
               tab === 'Departments' ? t('manageDepartments') : 
               tab === 'Events' ? t('cultureHubEvents') :
               tab === 'Modules' ? t('learningModules') :
               tab === 'Recognition' ? 'Recognition' :
               'Settings'}
            </button>
          ))}
        </div>
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
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload CSV
                </label>
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
                  <th className="p-4 font-semibold">{t('role')}</th>
                  <th className="p-4 font-semibold">{t('department')}</th>
                  <th className="p-4 font-semibold">Hire Date</th>
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
                    <td className="p-4 text-sm text-slate-600">{u.role}</td>
                    <td className="p-4 text-sm text-slate-600">{u.department}</td>
                    <td className="p-4 text-sm text-slate-600">{parseDate(u.hireDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {t('active')}
                      </span>
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
                  <option value="HR Admin">HR Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                <select
                  required
                  value={editUserForm.department || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
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
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ut.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
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
                  <th className="p-4 font-semibold">{t('employees')}</th>
                  <th className="p-4 font-semibold text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map(dept => {
                  const employeeCount = users.filter(u => u.department === dept).length;
                  const isEditing = editingDept?.oldName === dept;

                  return (
                    <tr key={dept} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingDept.newName}
                            onChange={(e) => setEditingDept({ ...editingDept, newName: e.target.value })}
                            className="border border-slate-300 rounded-md shadow-sm p-1 text-sm focus:ring-primary-500 focus:border-primary-500"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-900">{dept}</span>
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
                              onClick={() => setEditingDept({ oldName: dept, newName: dept })}
                              className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the ${dept} department?`)) {
                                  deleteDepartment(dept);
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          e.type === 'Birthday' ? 'bg-pink-100 text-pink-800' :
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
                {eventTypes.map(type => (
                  <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">{type}</span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the event type "${type}"?`)) {
                          deleteEventType(type);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete Event Type"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
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
                    <option key={type} value={type}>{type}</option>
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            module.type === 'Video' ? 'bg-blue-100 text-blue-800' :
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
              <h2 className="text-xl font-semibold text-slate-800">Employee of the Month Leaderboard</h2>
              <p className="text-sm text-slate-500 mt-1">
                Points: Trainings (10pts) + Peer Votes (5pts) + Supervisor Score (1-100pts)
              </p>
            </div>
            <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
              Current Month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Rank</th>
                  <th className="p-4 font-semibold">{t('employees')}</th>
                  <th className="p-4 font-semibold text-center">Trainings (x10)</th>
                  <th className="p-4 font-semibold text-center">Peer Votes (x5)</th>
                  <th className="p-4 font-semibold text-center">Supervisor Score</th>
                  <th className="p-4 font-semibold text-center">Total Points</th>
                  <th className="p-4 font-semibold text-right">Action</th>
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
                                WINNER
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
                          Save
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
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          currentEotm?.userId === entry.user.id
                            ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {currentEotm?.userId === entry.user.id ? 'Awarded' : 'Award EOTM'}
                      </button>
                    </td>
                  </tr>
                ))}
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                        primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
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
