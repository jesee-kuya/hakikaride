import { getJSON, setJSON } from './storage';

// The backend has no GET endpoint to check KYC / school-link status, so we
// cache the result locally the first time we successfully confirm it.
const kycKey = (userId: string) => `hakikaride_driver_kyc_${userId}`;
const linkedKey = (userId: string) => `hakikaride_driver_linked_${userId}`;

export const getKycDone = (userId: string) => getJSON<boolean>(kycKey(userId));
export const setKycDone = (userId: string) => setJSON(kycKey(userId), true);

export const getSchoolLinked = (userId: string) => getJSON<boolean>(linkedKey(userId));
export const setSchoolLinked = (userId: string) => setJSON(linkedKey(userId), true);
