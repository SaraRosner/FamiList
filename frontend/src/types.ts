// Shared frontend types aligned with backend schemas

export type MemberRole = 'ADMIN' | 'MEMBER' | 'RESTRICTED';

export interface Member {
  id: number;
  email: string;
  name: string;
  family_id: number | null;
  role: MemberRole | string; // keep string fallback for backward compatibility
}

