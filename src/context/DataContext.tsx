"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Event, EventType, TrainingModule, UserTraining, CelebrationPhoto, PeerVote, SupervisorScore, EmployeeOfTheMonth, Department, ActivityLog, Shift, AttendanceLog, ShiftType, Notification } from '../types';
import { mockEvents, mockTrainingModules, mockUserTrainings, mockCelebrationPhotos } from '../data/mockData';

interface DataContextType {
  users: User[];
  events: Event[];
  trainingModules: TrainingModule[];
  userTrainings: UserTraining[];
  departments: Department[];
  eventTypes: EventType[];
  shifts: Shift[];
  attendanceLogs: AttendanceLog[];
  shiftTypes: ShiftType[];
  activeShift: Shift | null;
  notifications: Notification[];
  fetchNotifications: (userId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string, userId?: string, markAllAsRead?: boolean) => Promise<void>;
  hotelConfig: {
    hotelLatitude: number | null;
    hotelLongitude: number | null;
    hotelGeofenceRadius: number | null;
    clockInWindowMinutes: number | null;
    workingDays: number[];
    hotelTimezone: string;
  };
  assignTraining: (userId: string, moduleId: string) => void;
  updateTrainingStatus: (userId: string, moduleId: string, status: UserTraining['status']) => void;
  isUserOnboarded: (user: User) => boolean;
  addTrainingModule: (module: Omit<TrainingModule, 'id'>) => void;
  updateTrainingModule: (id: string, module: Partial<TrainingModule>) => void;
  deleteTrainingModule: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  addDepartment: (department: Omit<Department, 'id'>) => void;
  updateDepartment: (id: string, department: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  addEventType: (name: string) => Promise<void>;
  updateEventType: (id: string, name: string) => Promise<void>;
  deleteEventType: (id: string) => Promise<void>;
  addEvent: (event: Event | Omit<Event, 'id'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  allEvents: Event[];
  celebrationPhotos: CelebrationPhoto[];
  addCelebrationPhoto: (photo: Omit<CelebrationPhoto, 'id' | 'uploadedAt'>) => void;
  updateCelebrationPhoto: (id: string, photo: Partial<CelebrationPhoto>) => void;
  deleteCelebrationPhoto: (id: string) => void;
  peerVotes: PeerVote[];
  addPeerVote: (vote: Omit<PeerVote, 'id'>) => void;
  supervisorScores: SupervisorScore[];
  setSupervisorScore: (score: Omit<SupervisorScore, 'id'>, submitterId: string) => void;
  employeesOfTheMonth: EmployeeOfTheMonth[];
  setEmployeeOfTheMonth: (eotm: Omit<EmployeeOfTheMonth, 'id' | 'awardedAt'>) => void;
  hotelLogo: string | null;
  setHotelLogo: (logoUrl: string | null) => void;
  updateHotelConfig: (config: Partial<DataContextType['hotelConfig']>) => Promise<void>;
  activityLogs: ActivityLog[];
  fetchActivityLogs: () => Promise<void>;
  clockIn: (userId: string, latitude: number, longitude: number, shiftId?: string, clockInReason?: string) => Promise<void>;
  clockOut: (userId: string, latitude: number, longitude: number, shiftId?: string) => Promise<void>;
  addShift: (shift: Omit<Shift, 'id'>) => Promise<void>;
  fetchUserShifts: (userId: string) => Promise<void>;
  fetchAttendanceLogs: (userId?: string) => Promise<void>;
  updateShift: (id: string, shift: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  fetchShifts: (filters: { userId?: string, departmentId?: string, startDate?: string, endDate?: string, status?: string }) => Promise<void>;
  approveShift: (id: string) => Promise<void>;
  adjustShiftTimes: (id: string, actualStartTime: string | null, actualEndTime: string | null) => Promise<any>;
  fetchWorkedHoursReport: (startDate: string, endDate: string, departmentId?: string) => Promise<any[]>;
  addShiftType: (type: Omit<ShiftType, 'id'>) => Promise<void>;
  updateShiftType: (id: string, type: Partial<ShiftType>) => Promise<void>;
  deleteShiftType: (id: string) => Promise<void>;
  fetchShiftTypes: (departmentId?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>(mockTrainingModules);
  const [userTrainings, setUserTrainings] = useState<UserTraining[]>(mockUserTrainings);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [celebrationPhotos, setCelebrationPhotos] = useState<CelebrationPhoto[]>(mockCelebrationPhotos);
  const [peerVotes, setPeerVotes] = useState<PeerVote[]>([]);
  const [supervisorScores, setSupervisorScores] = useState<SupervisorScore[]>([]);
  const [employeesOfTheMonth, setEmployeesOfTheMonth] = useState<EmployeeOfTheMonth[]>([]);
  const [hotelLogo, setHotelLogo] = useState<string | null>('/logo.png');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hotelConfig, setHotelConfig] = useState<{
    hotelLatitude: number | null;
    hotelLongitude: number | null;
    hotelGeofenceRadius: number | null;
    clockInWindowMinutes: number | null;
    workingDays: number[];
    hotelTimezone: string;
  }>({
    hotelLatitude: null,
    hotelLongitude: null,
    hotelGeofenceRadius: null,
    clockInWindowMinutes: null,
    workingDays: [1, 2, 3, 4, 5],
    hotelTimezone: 'America/Guatemala',
  });

  const fetchActivityLogs = async () => {
    try {
      const res = await fetch('/api/activity-logs');
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  // Fetch data from database APIs on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch Hotel Logo Configuration
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.hotelLogo) setHotelLogo(config.hotelLogo);
          const newConfig: DataContextType['hotelConfig'] = {
            hotelLatitude: null,
            hotelLongitude: null,
            hotelGeofenceRadius: null,
            clockInWindowMinutes: null,
            workingDays: [1, 2, 3, 4, 5],
            hotelTimezone: 'America/Guatemala',
          };

          // Assuming config is an array of { key: string, value: string } or similar
          // For now, assuming the API returns an object with direct properties
          if (config.hotelLatitude !== undefined) newConfig.hotelLatitude = parseFloat(config.hotelLatitude);
          if (config.hotelLongitude !== undefined) newConfig.hotelLongitude = parseFloat(config.hotelLongitude);
          if (config.hotelGeofenceRadius !== undefined) newConfig.hotelGeofenceRadius = parseFloat(config.hotelGeofenceRadius);
          if (config.clockInWindowMinutes !== undefined) newConfig.clockInWindowMinutes = parseInt(config.clockInWindowMinutes);
          if (config.workingDays !== undefined) newConfig.workingDays = config.workingDays;
          if (config.hotelTimezone !== undefined) newConfig.hotelTimezone = config.hotelTimezone;
 
          setHotelConfig(newConfig);
        }

        // Fetch User Notifications if user is logged in (simplified, normally triggered by auth)
        // Note: The bell component will call fetchNotifications explicitly.

        // Fetch Event Types
        const eventTypesRes = await fetch('/api/event-types');
        if (eventTypesRes.ok) {
          const eventTypesData = await eventTypesRes.json();
          setEventTypes(eventTypesData);
        }

        // Fetch Departments
        const deptRes = await fetch('/api/departments');
        if (deptRes.ok) {
          const loadedDepartments = await deptRes.json();
          if (loadedDepartments.length > 0) {
            setDepartments(loadedDepartments.map((d: any) => ({
              id: d.id,
              name: d.name,
              managerId: d.manager_id,
              parentId: d.parent_id,
              areas: d.areas || []
            })));
          }
        }

        // Fetch Events
        const eventsRes = await fetch('/api/events');
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.map((e: any) => ({
            ...e,
            date: e.date.split('T')[0], // format date string
            coverImageUrl: e.coverImageUrl || e.cover_image_url // ensure mapping
          })));
        }

        // Fetch Training Modules
        const modulesRes = await fetch('/api/training-modules');
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json();
          setTrainingModules(modulesData);
        }

        // Fetch User Trainings
        const userTrainingsRes = await fetch('/api/user-trainings');
        if (userTrainingsRes.ok) {
          const userTrainingsData = await userTrainingsRes.json();
          setUserTrainings(userTrainingsData);
        }

        // Fetch Celebrations
        const celebrationsRes = await fetch('/api/celebrations');
        if (celebrationsRes.ok) {
          const celebrationsData = await celebrationsRes.json();
          setCelebrationPhotos(celebrationsData);
        }

        // Fetch Gamification Data
        const gamificationRes = await fetch('/api/gamification');
        if (gamificationRes.ok) {
          const gamificationData = await gamificationRes.json();
          setPeerVotes(gamificationData.peerVotes);
          setSupervisorScores(gamificationData.supervisorScores);
          setEmployeesOfTheMonth(gamificationData.employeesOfTheMonth);
        }

        // Fetch all shift types
        const shiftTypesRes = await fetch('/api/shift-types');
        if (shiftTypesRes.ok) {
          const shiftTypesData = await shiftTypesRes.json();
          setShiftTypes(shiftTypesData);
        }

      } catch (error) {
        console.error('Error fetching initial data from APIs:', error);
      }
    };

    fetchAllData();
  }, []);

  const allEvents = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const birthdayEvents: Event[] = users.map(user => {
      const [y, m, d] = user.birthday.split('-');
      const currentYearBday = new Date(currentYear, parseInt(m) - 1, parseInt(d));
      const formattedName = user.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      return {
        id: `${formattedName}${currentYear}`,
        title: `${user.name}'s Birthday`,
        date: currentYearBday.toISOString().split('T')[0],
        type: 'Birthday' as const,
        description: `Wish ${user.name} from ${user.department} a happy birthday!`,
        coverImageUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop', // Default birthday image
      };
    });

    return [...events, ...birthdayEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, users]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const addUser = async (user: Omit<User, 'id'>): Promise<boolean> => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('hotel_hr_user') || '{}');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...user, currentUserId: currentUser.id }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to add user:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  };

  const updateUser = async (id: string, updatedUser: Partial<User>) => {
    try {
      let dataToSave = { ...updatedUser };

      // If avatar is a base64 image, upload it to cloud storage first
      if (dataToSave.avatarUrl && dataToSave.avatarUrl.startsWith('data:image')) {
        try {
          const base64Data = dataToSave.avatarUrl;
          // Convert base64 to a File object
          const res = await fetch(base64Data);
          const blob = await res.blob();
          const file = new File([blob], `avatar-${id}.jpg`, { type: blob.type });

          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            dataToSave.avatarUrl = url; // Replace base64 with cloud URL
          } else {
            console.error('Avatar upload to cloud failed, keeping local preview only.');
            delete dataToSave.avatarUrl; // Don't break the save
          }
        } catch (uploadErr) {
          console.error('Error uploading avatar:', uploadErr);
          delete dataToSave.avatarUrl;
        }
      }

      // Optimistically update local state so UI feels responsive
      setUsers(prev => prev.map(user => (user.id === id ? { ...user, ...updatedUser } : user)));

      // If it's a mock user ID (not a UUID), skip the DB update
      if (!id.includes('-')) {
        console.log('Mock user updated locally. Skipping DB update.');
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('hotel_hr_user') || '{}');
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataToSave, currentUserId: currentUser.id }),
      });

      if (response.ok) {
        const updated = await response.json();
        // Sync state with what DB confirmed (including the real cloud URL)
        setUsers(prev => prev.map(user => (user.id === id ? { ...user, ...updated } : user)));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update user in DB.', errorData);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const addDepartment = async (department: Omit<Department, 'id'>) => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: department.name,
          managerId: department.managerId,
          parentId: department.parentId,
          areas: department.areas
        }),
      });
      if (response.ok) {
        const newDept = await response.json();
        setDepartments(prev => [...prev, {
          id: newDept.id,
          name: newDept.name,
          managerId: newDept.manager_id,
          parentId: newDept.parent_id,
          areas: newDept.areas || []
        }]);
      }
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  const updateDepartment = async (id: string, department: Partial<Department>) => {
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: department.name,
          managerId: department.managerId,
          parentId: department.parentId,
          areas: department.areas
        }),
      });
      if (response.ok) {
        const updatedDept = await response.json();
        setDepartments(prev => prev.map(dept => (dept.id === id ? {
          id: updatedDept.id,
          name: updatedDept.name,
          managerId: updatedDept.manager_id,
          parentId: updatedDept.parent_id,
          areas: updatedDept.areas || []
        } : dept)));

        // If name changed, update users and modules (optimistic/simplified)
        if (department.name) {
          const oldDept = departments.find(d => d.id === id);
          if (oldDept && oldDept.name !== department.name) {
            setUsers(prev => prev.map(user => user.department === oldDept.name ? { ...user, department: department.name! } : user));
            setTrainingModules(prev => prev.map(module => ({
              ...module,
              targetDepartments: module.targetDepartments.map(deptName => deptName === oldDept.name ? department.name! : deptName)
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDepartments(prev => prev.filter(dept => dept.id !== id));
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const addEventType = async (name: string) => {
    try {
      const response = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const newType = await response.json();
        setEventTypes(prev => [...prev, newType]);
      }
    } catch (error) {
      console.error('Error adding event type:', error);
    }
  };

  const updateEventType = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/event-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const updatedType = await response.json();
        setEventTypes(prev => prev.map(t => t.id === id ? updatedType : t));
      }
    } catch (error) {
      console.error('Error updating event type:', error);
    }
  };

  const deleteEventType = async (id: string) => {
    try {
      const response = await fetch(`/api/event-types/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEventTypes(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event type:', error);
    }
  };

  const addEvent = async (event: Event | Omit<Event, 'id'>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (response.ok) {
        const newEvent = await response.json();
        setEvents(prev => [...prev, { ...newEvent, date: newEvent.date.split('T')[0], coverImageUrl: newEvent.coverImageUrl || newEvent.cover_image_url }]);
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent)
      });
      if (response.ok) {
        const result = await response.json();
        setEvents(prev => prev.map(event => (event.id === id ? { ...event, ...result, date: result.date.split('T')[0], coverImageUrl: result.coverImageUrl || result.cover_image_url } : event)));
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEvents(prev => prev.filter(event => event.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const addTrainingModule = async (module: Omit<TrainingModule, 'id'>) => {
    try {
      const response = await fetch('/api/training-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(module)
      });
      if (response.ok) {
        const newModule = await response.json();
        setTrainingModules(prev => [...prev, newModule]);
      }
    } catch (error) {
      console.error('Error adding module:', error);
    }
  };

  const updateTrainingModule = async (id: string, updatedModule: Partial<TrainingModule>) => {
    try {
      const response = await fetch(`/api/training-modules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedModule)
      });
      if (response.ok) {
        const result = await response.json();
        setTrainingModules(prev => prev.map(module => (module.id === id ? { ...module, ...result } : module)));
      }
    } catch (error) {
      console.error('Error updating module:', error);
    }
  };

  const deleteTrainingModule = async (id: string) => {
    try {
      const response = await fetch(`/api/training-modules/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTrainingModules(prev => prev.filter(module => module.id !== id));
        setUserTrainings(prev => prev.filter(ut => ut.moduleId !== id));
      }
    } catch (error) {
      console.error('Error deleting module:', error);
    }
  };

  const isUserOnboarded = (userToCheck: User) => {
    // 1. Get all modules required for onboarding that target this user's department
    const requiredModules = trainingModules.filter(
      (m) => m.isOnboardingRequirement && m.targetDepartments.includes(userToCheck.department)
    );

    if (requiredModules.length === 0) return true; // No onboarding required

    // 2. Check if the user has completed all of them
    const userCompletedModuleIds = userTrainings
      .filter((ut) => ut.userId === userToCheck.id && ut.status === 'Completed')
      .map((ut) => ut.moduleId);

    return requiredModules.every((rm) => userCompletedModuleIds.includes(rm.id));
  };

  const assignTraining = async (userId: string, moduleId: string) => {
    if (userTrainings.some(ut => ut.userId === userId && ut.moduleId === moduleId)) {
      return;
    }

    try {
      const response = await fetch('/api/user-trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, moduleId, status: 'Not Started' })
      });
      if (response.ok) {
        const newUserTraining = await response.json();
        setUserTrainings(prev => [...prev, newUserTraining]);
      }
    } catch (error) {
      console.error('Error assigning training:', error);
    }
  };

  const updateTrainingStatus = async (userId: string, moduleId: string, status: UserTraining['status']) => {
    const completionDate = status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined;

    try {
      const response = await fetch('/api/user-trainings', {
        method: 'POST', // UPSERT structure in API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, moduleId, status, completionDate })
      });
      if (response.ok) {
        setUserTrainings(prev =>
          prev.map(ut => {
            if (ut.userId === userId && ut.moduleId === moduleId) {
              return { ...ut, status, completionDate };
            }
            return ut;
          })
        );
      }
    } catch (error) {
      console.error('Error updating training status:', error);
    }
  };

  const addCelebrationPhoto = async (photo: Omit<CelebrationPhoto, 'id' | 'uploadedAt'>) => {
    try {
      const response = await fetch('/api/celebrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photo)
      });
      if (response.ok) {
        const newPhoto = await response.json();
        setCelebrationPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error('Error adding celebration photo:', error);
    }
  };

  const updateCelebrationPhoto = (id: string, updatedPhoto: Partial<CelebrationPhoto>) => {
    setCelebrationPhotos(prev =>
      prev.map(photo => (photo.id === id ? { ...photo, ...updatedPhoto } : photo))
    );
  };

  const deleteCelebrationPhoto = (id: string) => {
    setCelebrationPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const addPeerVote = async (vote: Omit<PeerVote, 'id'>) => {
    try {
      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'peerVote', payload: vote })
      });
      if (response.ok) {
        const result = await response.json();
        setPeerVotes(prev => {
          const filtered = prev.filter(v => !(v.voterId === vote.voterId && v.month === vote.month));
          return [...filtered, { ...vote, id: result.id }];
        });
      }
    } catch (error) {
      console.error('Error adding peer vote:', error);
    }
  };

  const setSupervisorScore = async (score: Omit<SupervisorScore, 'id'>, submitterId: string) => {
    try {
      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'supervisorScore', payload: { ...score, submitterId } })
      });
      if (response.ok) {
        const result = await response.json();
        setSupervisorScores(prev => {
          const filtered = prev.filter(s => !(s.employeeId === score.employeeId && s.month === score.month));
          return [...filtered, { ...score, id: result.id }];
        });
      }
    } catch (error) {
      console.error('Error setting supervisor score:', error);
    }
  };

  const setEmployeeOfTheMonth = async (eotm: Omit<EmployeeOfTheMonth, 'id' | 'awardedAt'>) => {
    try {
      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'employeeOfTheMonth', payload: eotm })
      });
      if (response.ok) {
        const result = await response.json();
        setEmployeesOfTheMonth(prev => {
          const filtered = prev.filter(e => e.month !== eotm.month);
          return [...filtered, { ...eotm, id: result.id, awardedAt: result.awarded_at }];
        });
      }
    } catch (error) {
      console.error('Error setting employee of the month:', error);
    }
  };

  const handleSetHotelLogo = async (logoUrl: string | null) => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelLogo: logoUrl })
      });
      if (response.ok) {
        setHotelLogo(logoUrl);
      }
    } catch (error) {
      console.error('Error setting hotel logo:', error);
    }
  };

  const updateHotelConfig = async (newConfig: Partial<DataContextType['hotelConfig']>) => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelLatitude: newConfig.hotelLatitude,
          hotelLongitude: newConfig.hotelLongitude,
          hotelGeofenceRadius: newConfig.hotelGeofenceRadius,
          clockInWindowMinutes: newConfig.clockInWindowMinutes,
          workingDays: newConfig.workingDays,
          hotelTimezone: newConfig.hotelTimezone,
        })
      });
      if (response.ok) {
        setHotelConfig(prev => ({ ...prev, ...newConfig }));
      }
    } catch (error) {
      console.error('Error updating hotel config:', error);
    }
  };

  const clockIn = async (userId: string, latitude: number, longitude: number, shiftId?: string, clockInReason?: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'CLOCK_IN', latitude, longitude, shiftId, clockInReason }),
      });
      if (response.ok) {
        const newLog = await response.json();
        setAttendanceLogs(prev => [newLog, ...prev]);

        // Refresh all shifts and the activeShift state immediately from the DB
        await fetchUserShifts(userId);
      }
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const clockOut = async (userId: string, latitude: number, longitude: number, shiftId?: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'CLOCK_OUT', latitude, longitude, shiftId }),
      });
      if (response.ok) {
        const newLog = await response.json();
        setAttendanceLogs(prev => [newLog, ...prev]);
        
        // Refresh all shifts and clear activeShift state immediately from the DB
        await fetchUserShifts(userId);
      }
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const addShift = async (shift: Omit<Shift, 'id'>) => {
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shift),
      });
      if (response.ok) {
        const newShift = await response.json();
        setShifts(prev => [...prev, newShift]);
      }
    } catch (error) {
      console.error('Error adding shift:', error);
    }
  };

  const fetchUserShifts = async (userId: string) => {
    try {
      const response = await fetch(`/api/shifts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setShifts(data);

        // Identify active shift
        const active = data.find((s: Shift) => s.status === 'Clocked-in');
        setActiveShift(active || null);
      }
    } catch (error) {
      console.error('Error fetching user shifts:', error);
    }
  };

  const updateShift = async (id: string, updatedShift: Partial<Shift>) => {
    try {
      const response = await fetch(`/api/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShift),
      });
      if (response.ok) {
        const result = await response.json();
        setShifts(prev => prev.map(s => s.id === id ? { ...s, ...result } : s));
      }
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  const deleteShift = async (id: string) => {
    try {
      const response = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setShifts(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const fetchShifts = async (filters: { userId?: string, departmentId?: string, startDate?: string, endDate?: string, status?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/shifts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchWorkedHoursReport = async (startDate: string, endDate: string, departmentId?: string) => {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (departmentId) params.append('departmentId', departmentId);

      const response = await fetch(`/api/reports/worked-hours?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching worked hours report:', error);
      return [];
    }
  };

  const fetchAttendanceLogs = async (userId?: string) => {
    try {
      const url = userId ? `/api/attendance?userId=${userId}` : '/api/attendance';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAttendanceLogs(data);
      }
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
    }
  };

  const fetchShiftTypes = async (departmentId?: string) => {
    try {
      const url = departmentId ? `/api/shift-types?departmentId=${departmentId}` : '/api/shift-types';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setShiftTypes(data);
      }
    } catch (error) {
      console.error('Error fetching shift types:', error);
    }
  };

  const addShiftType = async (type: Omit<ShiftType, 'id'>) => {
    try {
      const response = await fetch('/api/shift-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type),
      });
      if (response.ok) {
        const newType = await response.json();
        setShiftTypes(prev => [...prev, newType]);
      }
    } catch (error) {
      console.error('Error adding shift type:', error);
    }
  };

  const updateShiftType = async (id: string, updatedType: Partial<ShiftType>) => {
    try {
      const response = await fetch(`/api/shift-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedType),
      });
      if (response.ok) {
        const result = await response.json();
        setShiftTypes(prev => prev.map(t => t.id === id ? { ...t, ...result } : t));
      }
    } catch (error) {
      console.error('Error updating shift type:', error);
    }
  };

  const deleteShiftType = async (id: string) => {
    try {
      const response = await fetch(`/api/shift-types/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setShiftTypes(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting shift type:', error);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string, userId?: string, markAllAsRead?: boolean) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, userId, markAllAsRead })
      });
      if (res.ok) {
        if (markAllAsRead && userId) {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } else {
          setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const approveShift = async (id: string) => {
    try {
      const response = await fetch(`/api/shifts/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', approvedBy: 'admin' }),
      });
      if (response.ok) {
        const updatedShift = await response.json();
        setShifts(prev => prev.map(s => s.id === id ? updatedShift : s));
      }
    } catch (error) {
      console.error('Error approving shift:', error);
    }
  };

  const adjustShiftTimes = async (id: string, actualStartTime: string | null, actualEndTime: string | null) => {
    try {
      const body: any = {};
      if (actualStartTime !== null) body.actualStartTime = actualStartTime;
      if (actualEndTime !== null) body.actualEndTime = actualEndTime;

      const response = await fetch(`/api/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const updatedShift = await response.json();
        setShifts(prev => prev.map(s => s.id === id ? updatedShift : s));
        return updatedShift;
      }
    } catch (error) {
      console.error('Error adjusting shift times:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider
      value={{
        users,
        events,
        trainingModules,
        userTrainings,
        departments,
        eventTypes,
        assignTraining,
        updateTrainingStatus,
        isUserOnboarded,
        addTrainingModule,
        updateTrainingModule,
        deleteTrainingModule,
        addUser,
        updateUser,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addEventType,
        updateEventType,
        deleteEventType,
        addEvent,
        updateEvent,
        deleteEvent,
        allEvents,
        celebrationPhotos,
        addCelebrationPhoto,
        updateCelebrationPhoto,
        deleteCelebrationPhoto,
        peerVotes,
        addPeerVote,
        supervisorScores,
        setSupervisorScore,
        employeesOfTheMonth,
        setEmployeeOfTheMonth,
        hotelLogo,
        setHotelLogo: setHotelLogo,
        updateHotelConfig,
        activityLogs,
        fetchActivityLogs,
        clockIn,
        clockOut,
        addShift,
        fetchUserShifts,
        shifts,
        attendanceLogs,
        fetchAttendanceLogs,
        updateShift,
        deleteShift,
        fetchShifts,
        approveShift,
        adjustShiftTimes,
        fetchWorkedHoursReport,
        addShiftType,
        updateShiftType,
        deleteShiftType,
        fetchShiftTypes,
        shiftTypes,
        activeShift,
        hotelConfig,
        notifications,
        fetchNotifications,
        markNotificationAsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
