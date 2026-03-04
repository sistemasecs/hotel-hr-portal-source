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

  // Fetch data from database APIs on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch Hotel Logo Configuration
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.hotelLogo) setHotelLogo(config.hotelLogo);
        }

        // Fetch Departments
        const deptRes = await fetch('/api/departments');
        if (deptRes.ok) {
          const loadedDepartments = await deptRes.json();
          if (loadedDepartments.length > 0) {
            setDepartments(loadedDepartments.map((d: any) => d.name));
          }
        }

        // Fetch Events
        const eventsRes = await fetch('/api/events');
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.map((e: any) => ({
            ...e,
            date: e.date.split('T')[0] // format date string
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

      } catch (error) {
        console.error('Error fetching initial data from APIs:', error);
      }
    };

    fetchAllData();
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

  const addDepartment = async (department: string) => {
    if (!departments.includes(department)) {
      try {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: department }),
        });
        if (response.ok) {
          setDepartments(prev => [...prev, department]);
        }
      } catch (error) {
        console.error('Error adding department:', error);
      }
    }
  };

  const updateDepartment = async (oldName: string, newName: string) => {
    // For a robust implementation, the UI would need the department ID. 
    // Assuming UI passes ID here, but if it passes oldName we need a mapping.
    // Simplifying for this demo by updating state optimistically. Real app would do a PUT /api/departments/:id
    setDepartments(prev => prev.map(dept => (dept === oldName ? newName : dept)));
    setUsers(prev => prev.map(user => user.department === oldName ? { ...user, department: newName } : user));
    setTrainingModules(prev => prev.map(module => ({
      ...module,
      targetDepartments: module.targetDepartments.map(dept => dept === oldName ? newName : dept)
    })));
  };

  const deleteDepartment = async (department: string) => {
    // Similarly, requires department ID. 
    setDepartments(prev => prev.filter(dept => dept !== department));
  };

  const addEventType = (type: string) => {
    // Storing EventTypes is simple for now, using localStorage is fine for lightweight config
    // but ideally we would migrate this to the `hotel_config` table too.
    if (!eventTypes.includes(type)) {
      setEventTypes(prev => [...prev, type]);
    }
  };

  const deleteEventType = (type: string) => {
    setEventTypes(prev => prev.filter(t => t !== type));
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
        setEvents(prev => [...prev, { ...newEvent, date: newEvent.date.split('T')[0] }]);
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
        setEvents(prev => prev.map(event => (event.id === id ? { ...event, ...result, date: result.date.split('T')[0] } : event)));
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

  const setSupervisorScore = async (score: Omit<SupervisorScore, 'id'>) => {
    try {
      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'supervisorScore', payload: score })
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
        setHotelLogo: handleSetHotelLogo,
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
