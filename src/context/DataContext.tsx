"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Event, TrainingModule, UserTraining, CelebrationPhoto, PeerVote, SupervisorScore, EmployeeOfTheMonth } from '../types';
import { mockEvents, mockTrainingModules, mockUserTrainings, mockCelebrationPhotos } from '../data/mockData';

interface DataContextType {
  users: User[];
  events: Event[];
  trainingModules: TrainingModule[];
  userTrainings: UserTraining[];
  departments: string[];
  eventTypes: string[];
  assignTraining: (userId: string, moduleId: string) => void;
  updateTrainingStatus: (userId: string, moduleId: string, status: UserTraining['status']) => void;
  addTrainingModule: (module: Omit<TrainingModule, 'id'>) => void;
  updateTrainingModule: (id: string, module: Partial<TrainingModule>) => void;
  deleteTrainingModule: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  addDepartment: (department: string) => void;
  updateDepartment: (oldName: string, newName: string) => void;
  deleteDepartment: (department: string) => void;
  addEventType: (type: string) => void;
  deleteEventType: (type: string) => void;
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
  setSupervisorScore: (score: Omit<SupervisorScore, 'id'>) => void;
  employeesOfTheMonth: EmployeeOfTheMonth[];
  setEmployeeOfTheMonth: (eotm: Omit<EmployeeOfTheMonth, 'id' | 'awardedAt'>) => void;
  hotelLogo: string | null;
  setHotelLogo: (logoUrl: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>(mockTrainingModules);
  const [userTrainings, setUserTrainings] = useState<UserTraining[]>(mockUserTrainings);
  const [departments, setDepartments] = useState<string[]>(['Front Desk', 'F&B', 'Maintenance', 'HR', 'Housekeeping']);
  const [eventTypes, setEventTypes] = useState<string[]>(['Birthday', 'Celebration', 'Social', 'Meeting', 'Other']);
  const [celebrationPhotos, setCelebrationPhotos] = useState<CelebrationPhoto[]>(mockCelebrationPhotos);
  const [peerVotes, setPeerVotes] = useState<PeerVote[]>([]);
  const [supervisorScores, setSupervisorScores] = useState<SupervisorScore[]>([]);
  const [employeesOfTheMonth, setEmployeesOfTheMonth] = useState<EmployeeOfTheMonth[]>([]);
  const [hotelLogo, setHotelLogo] = useState<string | null>('/logo.png');

  // Load persisted data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDepts = localStorage.getItem('hotel_departments');
      if (savedDepts) {
        try {
          setDepartments(JSON.parse(savedDepts));
        } catch (e) {
          console.error('Failed to parse departments from localStorage');
        }
      }

      const savedEventTypes = localStorage.getItem('hotel_event_types');
      if (savedEventTypes) {
        try {
          setEventTypes(JSON.parse(savedEventTypes));
        } catch (e) {
          console.error('Failed to parse event types from localStorage');
        }
      }

      const savedLogo = localStorage.getItem('hotel_logo');
      if (savedLogo) {
        setHotelLogo(savedLogo);
      }

      const savedEvents = localStorage.getItem('hotel_events');
      if (savedEvents) {
        try {
          setEvents(JSON.parse(savedEvents));
        } catch (e) {
          console.error('Failed to parse events from localStorage');
        }
      }

      const savedModules = localStorage.getItem('hotel_training_modules');
      if (savedModules) {
        try {
          setTrainingModules(JSON.parse(savedModules));
        } catch (e) {
          console.error('Failed to parse training modules from localStorage');
        }
      }
    }
  }, []);

  // Save training modules to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_training_modules', JSON.stringify(trainingModules));
    }
  }, [trainingModules]);

  // Save departments to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_departments', JSON.stringify(departments));
    }
  }, [departments]);

  // Save event types to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_event_types', JSON.stringify(eventTypes));
    }
  }, [eventTypes]);

  // Save events to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_events', JSON.stringify(events));
    }
  }, [events]);

  // Save hotelLogo to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (hotelLogo) {
        localStorage.setItem('hotel_logo', hotelLogo);
      } else {
        localStorage.removeItem('hotel_logo');
      }
    }
  }, [hotelLogo]);

  const allEvents = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const birthdayEvents: Event[] = users.map(user => {
      const [y, m, d] = user.birthday.split('-');
      const currentYearBday = new Date(currentYear, parseInt(m) - 1, parseInt(d));
      
      return {
        id: `bday-${user.id}`,
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
          // Merge with localStorage avatars and fit preferences
          const usersWithLocalData = data.map((u: User) => {
            if (typeof window !== 'undefined') {
              const localAvatar = localStorage.getItem(`avatar_${u.id}`);
              const localFit = localStorage.getItem(`avatarFit_${u.id}`);
              return {
                ...u,
                avatarUrl: localAvatar || u.avatarUrl,
                avatarFit: (localFit as 'cover' | 'contain') || u.avatarFit || 'cover'
              };
            }
            return u;
          });
          setUsers(usersWithLocalData);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const addUser = async (user: Omit<User, 'id'>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
      } else {
        console.error('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const updateUser = async (id: string, updatedUser: Partial<User>) => {
    try {
      // Save avatar and fit to localStorage to bypass DB size limits for base64 images
      if (typeof window !== 'undefined') {
        if (updatedUser.avatarUrl) {
          localStorage.setItem(`avatar_${id}`, updatedUser.avatarUrl);
        }
        if (updatedUser.avatarFit) {
          localStorage.setItem(`avatarFit_${id}`, updatedUser.avatarFit);
        }

        // If updating the currently logged-in user, update auth storage too
        const storedAuthUser = localStorage.getItem('hotel_hr_user');
        if (storedAuthUser) {
          try {
            const authUser = JSON.parse(storedAuthUser);
            if (authUser.id === id) {
              localStorage.setItem('hotel_hr_user', JSON.stringify({ ...authUser, ...updatedUser }));
            }
          } catch (e) {
            console.error('Failed to parse stored auth user', e);
          }
        }
      }

      // Optimistically update local state so UI feels responsive
      setUsers(prev => prev.map(user => (user.id === id ? { ...user, ...updatedUser } : user)));

      // If it's a mock user ID (not a UUID), skip the DB update
      if (!id.includes('-')) {
        console.log('Mock user updated locally. Skipping DB update.');
        return;
      }

      // Create a copy without the potentially huge base64 avatarUrl for the DB update
      const dbUpdateData = { ...updatedUser };
      if (dbUpdateData.avatarUrl && dbUpdateData.avatarUrl.startsWith('data:image')) {
        delete dbUpdateData.avatarUrl; // Don't send huge base64 to DB
      }

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbUpdateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update user in DB, but local state was updated.', errorData);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const addDepartment = (department: string) => {
    if (!departments.includes(department)) {
      setDepartments(prev => [...prev, department]);
    }
  };

  const updateDepartment = (oldName: string, newName: string) => {
    setDepartments(prev => prev.map(dept => (dept === oldName ? newName : dept)));
    // Also update users and training modules that reference this department
    setUsers(prev => prev.map(user => user.department === oldName ? { ...user, department: newName } : user));
    setTrainingModules(prev => prev.map(module => ({
      ...module,
      targetDepartments: module.targetDepartments.map(dept => dept === oldName ? newName : dept)
    })));
  };

  const deleteDepartment = (department: string) => {
    setDepartments(prev => prev.filter(dept => dept !== department));
  };

  const addEventType = (type: string) => {
    if (!eventTypes.includes(type)) {
      setEventTypes(prev => [...prev, type]);
    }
  };

  const deleteEventType = (type: string) => {
    setEventTypes(prev => prev.filter(t => t !== type));
  };

  const addEvent = (event: Event | Omit<Event, 'id'>) => {
    const newEvent: Event = {
      id: 'id' in event ? event.id : `e${Date.now()}`,
      ...event,
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updatedEvent: Partial<Event>) => {
    setEvents(prev => prev.map(event => (event.id === id ? { ...event, ...updatedEvent } : event)));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const addTrainingModule = (module: Omit<TrainingModule, 'id'>) => {
    const newModule: TrainingModule = {
      ...module,
      id: `t${Date.now()}`, // Simple ID generation
    };
    setTrainingModules(prev => [...prev, newModule]);
  };

  const updateTrainingModule = (id: string, updatedModule: Partial<TrainingModule>) => {
    setTrainingModules(prev =>
      prev.map(module => (module.id === id ? { ...module, ...updatedModule } : module))
    );
  };

  const deleteTrainingModule = (id: string) => {
    setTrainingModules(prev => prev.filter(module => module.id !== id));
    // Also remove associated user trainings
    setUserTrainings(prev => prev.filter(ut => ut.moduleId !== id));
  };

  const assignTraining = (userId: string, moduleId: string) => {
    // Check if already assigned
    if (userTrainings.some(ut => ut.userId === userId && ut.moduleId === moduleId)) {
      return;
    }
    setUserTrainings(prev => [...prev, { userId, moduleId, status: 'Not Started' }]);
  };

  const updateTrainingStatus = (userId: string, moduleId: string, status: UserTraining['status']) => {
    setUserTrainings(prev =>
      prev.map(ut => {
        if (ut.userId === userId && ut.moduleId === moduleId) {
          return {
            ...ut,
            status,
            completionDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return ut;
      })
    );
  };

  const addCelebrationPhoto = (photo: Omit<CelebrationPhoto, 'id' | 'uploadedAt'>) => {
    const newPhoto: CelebrationPhoto = {
      ...photo,
      id: `p${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setCelebrationPhotos(prev => [...prev, newPhoto]);
  };

  const updateCelebrationPhoto = (id: string, updatedPhoto: Partial<CelebrationPhoto>) => {
    setCelebrationPhotos(prev =>
      prev.map(photo => (photo.id === id ? { ...photo, ...updatedPhoto } : photo))
    );
  };

  const deleteCelebrationPhoto = (id: string) => {
    setCelebrationPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const addPeerVote = (vote: Omit<PeerVote, 'id'>) => {
    // Check if user already voted this month
    const existingVote = peerVotes.find(v => v.voterId === vote.voterId && v.month === vote.month);
    if (existingVote) {
      setPeerVotes(prev => prev.map(v => v.id === existingVote.id ? { ...vote, id: existingVote.id } : v));
    } else {
      setPeerVotes(prev => [...prev, { ...vote, id: `pv${Date.now()}` }]);
    }
  };

  const setSupervisorScore = (score: Omit<SupervisorScore, 'id'>) => {
    const existingScore = supervisorScores.find(s => s.employeeId === score.employeeId && s.month === score.month);
    if (existingScore) {
      setSupervisorScores(prev => prev.map(s => s.id === existingScore.id ? { ...score, id: existingScore.id } : s));
    } else {
      setSupervisorScores(prev => [...prev, { ...score, id: `ss${Date.now()}` }]);
    }
  };

  const setEmployeeOfTheMonth = (eotm: Omit<EmployeeOfTheMonth, 'id' | 'awardedAt'>) => {
    const existing = employeesOfTheMonth.find(e => e.month === eotm.month);
    if (existing) {
      setEmployeesOfTheMonth(prev => prev.map(e => e.id === existing.id ? { ...eotm, id: existing.id, awardedAt: new Date().toISOString() } : e));
    } else {
      setEmployeesOfTheMonth(prev => [...prev, { ...eotm, id: `eotm${Date.now()}`, awardedAt: new Date().toISOString() }]);
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
        addTrainingModule,
        updateTrainingModule,
        deleteTrainingModule,
        addUser,
        updateUser,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addEventType,
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
        setHotelLogo,
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
