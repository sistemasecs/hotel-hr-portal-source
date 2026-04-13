export type StaffFieldType = 'text' | 'number' | 'date' | 'boolean';

export interface NativeStaffFieldDef {
  field_key: string;
  label: string;
  field_type: StaffFieldType;
  group_key: string;
  show_in_profile: boolean;
  employee_editable: boolean;
  required_for_contract: boolean;
  sort_order: number;
  is_system: true;
  is_deletable: false;
}

export const NATIVE_STAFF_FIELDS: NativeStaffFieldDef[] = [
  { field_key: 'name', label: 'Name', field_type: 'text', group_key: 'identity', show_in_profile: true, employee_editable: false, required_for_contract: true, sort_order: 10, is_system: true, is_deletable: false },
  { field_key: 'email', label: 'Email', field_type: 'text', group_key: 'identity', show_in_profile: true, employee_editable: false, required_for_contract: true, sort_order: 20, is_system: true, is_deletable: false },
  { field_key: 'role', label: 'Role', field_type: 'text', group_key: 'identity', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 30, is_system: true, is_deletable: false },

  { field_key: 'department', label: 'Department', field_type: 'text', group_key: 'organization', show_in_profile: true, employee_editable: false, required_for_contract: true, sort_order: 40, is_system: true, is_deletable: false },
  { field_key: 'area', label: 'Area', field_type: 'text', group_key: 'organization', show_in_profile: true, employee_editable: false, required_for_contract: false, sort_order: 50, is_system: true, is_deletable: false },
  { field_key: 'supervisorId', label: 'Supervisor', field_type: 'text', group_key: 'organization', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 60, is_system: true, is_deletable: false },

  { field_key: 'employmentType', label: 'Employment Type', field_type: 'text', group_key: 'contract', show_in_profile: true, employee_editable: false, required_for_contract: true, sort_order: 70, is_system: true, is_deletable: false },
  { field_key: 'contractSigningDate', label: 'Contract Signing Date', field_type: 'date', group_key: 'contract', show_in_profile: true, employee_editable: false, required_for_contract: false, sort_order: 80, is_system: true, is_deletable: false },
  { field_key: 'hireDate', label: 'Hire Date', field_type: 'date', group_key: 'contract', show_in_profile: true, employee_editable: false, required_for_contract: true, sort_order: 90, is_system: true, is_deletable: false },
  { field_key: 'hotelContract', label: 'Hotel Contract', field_type: 'text', group_key: 'contract', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 100, is_system: true, is_deletable: false },
  { field_key: 'baseSalary', label: 'Base Salary', field_type: 'number', group_key: 'contract', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 110, is_system: true, is_deletable: false },
  { field_key: 'incentiveBonus', label: 'Incentive Bonus', field_type: 'number', group_key: 'contract', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 120, is_system: true, is_deletable: false },

  { field_key: 'birthday', label: 'Birthday', field_type: 'date', group_key: 'personal', show_in_profile: true, employee_editable: true, required_for_contract: true, sort_order: 130, is_system: true, is_deletable: false },
  { field_key: 'phone', label: 'Phone', field_type: 'text', group_key: 'contact', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 140, is_system: true, is_deletable: false },
  { field_key: 'address', label: 'Address', field_type: 'text', group_key: 'contact', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 150, is_system: true, is_deletable: false },
  { field_key: 'taxId', label: 'Tax ID', field_type: 'text', group_key: 'identity', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 160, is_system: true, is_deletable: false },
  { field_key: 'dpi', label: 'DPI', field_type: 'text', group_key: 'identity', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 170, is_system: true, is_deletable: false },

  { field_key: 'emergencyContactName', label: 'Emergency Contact Name', field_type: 'text', group_key: 'contact', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 180, is_system: true, is_deletable: false },
  { field_key: 'emergencyContactPhone', label: 'Emergency Contact Phone', field_type: 'text', group_key: 'contact', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 190, is_system: true, is_deletable: false },

  { field_key: 'maritalStatus', label: 'Marital Status', field_type: 'text', group_key: 'personal', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 200, is_system: true, is_deletable: false },
  { field_key: 'spouseName', label: 'Spouse Name', field_type: 'text', group_key: 'personal', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 210, is_system: true, is_deletable: false },
  { field_key: 'childrenCount', label: 'Children Count', field_type: 'number', group_key: 'personal', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 220, is_system: true, is_deletable: false },

  { field_key: 'nationality', label: 'Nationality', field_type: 'text', group_key: 'personal', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 230, is_system: true, is_deletable: false },
  { field_key: 'placeOfBirth', label: 'Place of Birth', field_type: 'text', group_key: 'personal', show_in_profile: true, employee_editable: true, required_for_contract: false, sort_order: 240, is_system: true, is_deletable: false },

  { field_key: 'socialSecurityNumber', label: 'Social Security Number', field_type: 'text', group_key: 'legal', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 250, is_system: true, is_deletable: false },
  { field_key: 'socialSecurityCode', label: 'Social Security Code', field_type: 'text', group_key: 'legal', show_in_profile: false, employee_editable: false, required_for_contract: false, sort_order: 260, is_system: true, is_deletable: false },
];
