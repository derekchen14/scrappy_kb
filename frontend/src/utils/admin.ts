// Hardcoded list of admin emails
const ADMIN_EMAILS = [
  'admin@scrappykb.com',
  'derek@scrappykb.com', 
  'founder@scrappykb.com'
];

export const isAdminUser = (userEmail?: string): boolean => {
  if (!userEmail) return false;
  return ADMIN_EMAILS.includes(userEmail.toLowerCase());
};

export const getAdminEmails = (): string[] => {
  return [...ADMIN_EMAILS];
};

export const canEditProfile = (userEmail?: string, profileOwnerEmail?: string): boolean => {
  // Admins can edit any profile
  if (isAdminUser(userEmail)) {
    return true;
  }
  
  // Regular users can only edit their own profile
  return userEmail?.toLowerCase() === profileOwnerEmail?.toLowerCase();
};

export const canDeleteUser = (userEmail?: string): boolean => {
  return isAdminUser(userEmail);
};

export const canToggleProfileVisibility = (userEmail?: string): boolean => {
  return isAdminUser(userEmail);
};