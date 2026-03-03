import { User, Event, TrainingModule, UserTraining, CelebrationPhoto } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@hotel.com',
    role: 'HR Admin',
    department: 'HR',
    birthday: '1985-04-12',
    hireDate: '2018-02-15',
  },
  {
    id: 'u2',
    name: 'Michael Chang',
    email: 'michael.c@hotel.com',
    role: 'Staff',
    department: 'Front Desk',
    birthday: '1992-08-24',
    hireDate: '2021-06-01',
  },
  {
    id: 'u3',
    name: 'Elena Rodriguez',
    email: 'elena.r@hotel.com',
    role: 'Staff',
    department: 'F&B',
    birthday: '1990-11-05',
    hireDate: '2020-03-10',
  },
  {
    id: 'u4',
    name: 'David Smith',
    email: 'david.s@hotel.com',
    role: 'Staff',
    department: 'Maintenance',
    birthday: '1988-01-15',
    hireDate: '2019-09-20',
  },
  {
    id: 'u5',
    name: 'Jessica Lee',
    email: 'jessica.l@hotel.com',
    role: 'Staff',
    department: 'Housekeeping',
    birthday: '1995-07-30',
    hireDate: '2022-01-10',
  },
  {
    id: 'u6',
    name: 'Carlos Lara',
    email: 'sistemas@elcarmenhotel.com',
    role: 'HR Admin',
    department: 'IT',
    birthday: '1985-03-15',
    hireDate: '2015-01-01',
  }
];

export const mockEvents: Event[] = [];

export const mockTrainingModules: TrainingModule[] = [
  {
    id: 't1',
    title: 'Guest Service Excellence',
    description: 'Core principles of 5-star guest service.',
    type: 'Video',
    duration: '30 mins',
    targetDepartments: ['Front Desk', 'F&B', 'Housekeeping'],
    required: true,
  },
  {
    id: 't2',
    title: 'Food Safety Standards',
    description: 'Latest health and safety guidelines for food handling.',
    type: 'Document',
    duration: '45 mins',
    targetDepartments: ['F&B'],
    required: true,
  },
  {
    id: 't3',
    title: 'HVAC Maintenance Basics',
    description: 'Routine checks and troubleshooting for hotel HVAC systems.',
    type: 'Video',
    duration: '60 mins',
    targetDepartments: ['Maintenance'],
    required: true,
  },
  {
    id: 't4',
    title: 'Conflict Resolution',
    description: 'Techniques for handling difficult guest situations.',
    type: 'Video',
    duration: '20 mins',
    targetDepartments: ['Front Desk', 'F&B', 'HR'],
    required: false,
  },
  {
    id: 't5',
    title: 'Data Privacy & Security',
    description: 'Handling guest information securely.',
    type: 'Quiz',
    duration: '15 mins',
    targetDepartments: ['Front Desk', 'HR'],
    required: true,
  }
];

export const mockUserTrainings: UserTraining[] = [
  { userId: 'u2', moduleId: 't1', status: 'Completed', completionDate: '2026-01-15' },
  { userId: 'u2', moduleId: 't4', status: 'In Progress' },
  { userId: 'u2', moduleId: 't5', status: 'Not Started' },
  { userId: 'u3', moduleId: 't1', status: 'Completed', completionDate: '2026-02-10' },
  { userId: 'u3', moduleId: 't2', status: 'Not Started' },
  { userId: 'u4', moduleId: 't3', status: 'In Progress' },
];

export const mockCelebrationPhotos: CelebrationPhoto[] = [
  {
    id: 'p1',
    title: 'Sarah\'s Birthday Celebration',
    caption: 'Happy birthday Sarah! 🎉',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
    eventType: 'Birthday',
    eventDate: '2026-04-12',
    uploadedBy: 'u1',
    uploadedAt: '2026-04-12T10:00:00Z',
    eventId: 'e1',
  },
  {
    id: 'p2',
    title: 'Q1 Townhall Meeting',
    caption: 'Great turnout for our quarterly update!',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
    eventType: 'Meeting',
    eventDate: '2026-03-15',
    uploadedBy: 'u6',
    uploadedAt: '2026-03-15T14:30:00Z',
    eventId: 'e2',
  },
  {
    id: 'p3',
    title: 'Employee Appreciation Dinner',
    caption: 'Celebrating our amazing team at the rooftop terrace',
    imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=600&fit=crop',
    eventType: 'Celebration',
    eventDate: '2026-05-20',
    uploadedBy: 'u1',
    uploadedAt: '2026-05-20T19:00:00Z',
    eventId: 'e3',
  },
];
