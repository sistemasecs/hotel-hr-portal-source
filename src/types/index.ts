export type Role = 'Staff' | 'Supervisor' | 'Manager' | 'HR Admin' | 'Weekly Staff';

export interface Department {
  id: string;
  name: string;
  managerId?: string | null;
  parentId?: string | null;
  areas?: string[];
}

export interface StaffCustomFieldDefinition {
  id: string;
  field_key: string;
  label: string;
  field_type: 'text' | 'number' | 'date' | 'boolean';
  required_for_contract: boolean;
  is_active: boolean;
  group_key: string;
  show_in_profile: boolean;
  employee_editable: boolean;
  sort_order: number;
  is_system?: boolean;
  is_deletable?: boolean;
  created_at?: string;
  updated_at?: string;
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
  employmentType?: 'Contract' | 'Weekly';
  contractSigningDate?: string | null;
  likes?: string[];
  dislikes?: string[];
  tShirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  allergies?: string[];
  isActive?: boolean;
  inactiveDate?: string | null;
  inactiveReason?: string | null;
  // New profile fields
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  maritalStatus?: string | null;
  spouseName?: string | null;
  childrenCount?: number;
  taxId?: string | null;
  healthCardUrl?: string | null;
  foodHandlingCardUrl?: string | null;
  criminalRecordUrl?: string | null;
  policeRecordUrl?: string | null;
  askMeAbout?: string[];
  badges?: string[];
  dpi?: string | null;
  socialSecurityNumber?: string | null;
  phone?: string | null;
  spouseDpi?: string | null;
  cardNumber?: string | null;
  renewalDate?: string | null;
  nationality?: string | null;
  placeOfBirth?: string | null;
  socialSecurityCode?: string | null;
  occupation?: string | null;
  educationLevel?: string | null;
  profession?: string | null;
  address?: string | null;
  accountType?: string | null;
  criminalRecord?: number | null;
  policeRecord?: number | null;
  healthCardExp?: string | null;
  foodHandlingCardExp?: string | null;
  criminalRecordExp?: string | null;
  policeRecordExp?: string | null;
  dpiExp?: string | null;
  dpiUrl?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
  childrenNames?: string | null;
  hotelContract?: string | null;
  baseSalary?: number | null;
  incentiveBonus?: number | null;
  customFields?: Record<string, string | number | boolean | null>;
  hasSeenTour?: boolean;
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

export interface EventType {
  id: string;
  name: string;
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
  contentType?: 'Url' | 'File'; // New field
  fileName?: string; // New field
  fileSize?: number; // New field
  mimeType?: string; // New field
  questions?: QuizQuestion[]; // For Quiz
  passingScore?: number; // For Quiz
  isOnboardingRequirement?: boolean;
  category?: string;
}

export interface UserTraining {
  userId: string;
  moduleId: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  completionDate?: string;
}

export interface TierCompletion {
  userId: string;
  tierId: number;
  completedAt: string;
  signatureData: string;
}

export interface TrainingTier {
  id: number;
  name: string;
  description: string;
  agreementTemplate: string;
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
  isSigned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SIGN' | 'COMPLETE';
  entityType: string;
  entityId: string | null;
  details: any;
  createdAt: string;
}
export interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  status: 'Scheduled' | 'Clocked-in' | 'Completed' | 'Absent' | 'Pending Approval';
  type: string;
  user_name?: string;
  department_name?: string;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
  approved_by?: string | null;
  approval_notes?: string | null;
  clock_in_reason?: string | null;
}

export interface ShiftType {
  id: string;
  name: string;
  department_id: string;
  start_time_default?: string | null;
  end_time_default?: string | null;
  color?: string | null;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  shift_id: string | null;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  clock_in_reason?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'REQUEST_APPROVED' | 'EVENT_TAG' | 'BIRTHDAY_COMMENT' | 'MENTION';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
