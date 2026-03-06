export type Role = 'Staff' | 'Supervisor' | 'Manager' | 'HR Admin';

export interface Department {
  id: string;
  name: string;
  managerId?: string | null;
  parentId?: string | null;
  areas?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  area?: string | null;
  supervisorId?: string | null;
  avatarUrl?: string;
  avatarFit?: 'cover' | 'contain';
  birthday: string; // YYYY-MM-DD
  hireDate: string; // YYYY-MM-DD
  likes?: string[];
  dislikes?: string[];
  tShirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  allergies?: string[];
}

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: string;
  description: string;
  location?: string;
  coverImageUrl?: string; // Optional cover image for the event's photo album
}

export interface QuizOption {
  text: string;
  score: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  type: 'Video' | 'Document' | 'Quiz';
  duration: string; // e.g., "15 mins"
  targetDepartments: string[];
  required: boolean;
  contentUrl?: string; // For Video/Document
  questions?: QuizQuestion[]; // For Quiz
  passingScore?: number; // For Quiz
}

export interface UserTraining {
  userId: string;
  moduleId: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  completionDate?: string;
}

export interface CelebrationPhoto {
  id: string;
  title: string;
  caption?: string;
  imageUrl: string;
  eventType: string;
  eventDate: string; // YYYY-MM-DD
  uploadedBy: string; // userId
  uploadedAt: string; // ISO timestamp
  eventId?: string; // reference to the Event this photo belongs to
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  imageUrl?: string;
  createdAt: string; // ISO timestamp
  reactions: {
    emoji: string;
    userIds: string[];
  }[];
}

export interface PeerVote {
  id: string;
  voterId: string;
  nomineeId: string;
  month: string; // YYYY-MM
  reason?: string;
}

export interface SupervisorScore {
  id: string;
  employeeId: string;
  score: number; // e.g., 1-100
  month: string; // YYYY-MM
  notes?: string;
}

export interface EmployeeOfTheMonth {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  awardedAt: string; // ISO timestamp
}

export type RequestType = 
  | 'Vacation' 
  | 'Absence' 
  | 'Shift Change' 
  | 'Uniform' 
  | 'Data Update' 
  | 'Document' 
  | 'Absence Proof'
  | 'Discount'
  | 'Responsibility'
  | 'Without Uniform'
  | 'Health Make-up'
  | 'Other';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface EmployeeRequest {
  id: string;
  userId: string;
  userName?: string;
  userDepartment?: string;
  type: RequestType;
  status: RequestStatus;
  data: any; // JSON data specific to the request type
  supervisorId?: string | null;
  hrNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string | null;
  details: any;
  createdAt: string;
}
