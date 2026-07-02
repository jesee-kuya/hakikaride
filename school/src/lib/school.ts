// The backend has no GET /school endpoint to check whether the admin already
// created their school, so we cache the School object locally the first time
// we successfully create it (or hit a 409 telling us one already exists).
export type School = {
  id: string;
  admin_id: string;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  created_at?: string;
  updated_at?: string;
};

const schoolKey = (userId: string) => `hakikaride_school_profile_${userId}`;

export function getCachedSchool(userId: string): School | null {
  const raw = localStorage.getItem(schoolKey(userId));
  return raw ? (JSON.parse(raw) as School) : null;
}

export function setCachedSchool(userId: string, school: School) {
  localStorage.setItem(schoolKey(userId), JSON.stringify(school));
}

export function markSchoolExists(userId: string) {
  const existing = getCachedSchool(userId);
  if (!existing) {
    localStorage.setItem(
      schoolKey(userId),
      JSON.stringify({ id: '', admin_id: userId, name: '', address: '', contact_email: '', contact_phone: '' }),
    );
  }
}
