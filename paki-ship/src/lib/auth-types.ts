export type UserRole = "customer" | "driver" | "operator";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  role: UserRole;
  address: string;
  city: string;
  province: string;
  documents: string[];
  createdAt: string;
};

export type SessionPayload = {
  userId: string;
  role: UserRole;
  fullName: string;
};
