// Simple file-based storage for RSVPs (in production, use a database)
import fs from 'fs';
import path from 'path';

export interface RSVPData {
  id: string;
  name: string;
  email: string;
  attending: boolean;
  guestCount: number;
  dietaryNotes?: string;
  submittedAt: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'rsvp-data.json');

function ensureStorageFile() {
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify([], null, 2));
  }
}

export function getAllRSVPs(): RSVPData[] {
  ensureStorageFile();
  const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveRSVP(rsvp: RSVPData): RSVPData {
  ensureStorageFile();
  const rsvps = getAllRSVPs();
  rsvps.push(rsvp);
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(rsvps, null, 2));
  return rsvp;
}

export function isDuplicateRSVP(email: string, date: string): boolean {
  const rsvps = getAllRSVPs();
  return rsvps.some(
    (rsvp) =>
      rsvp.email.toLowerCase() === email.toLowerCase() &&
      rsvp.submittedAt.split('T')[0] === date.split('T')[0]
  );
}
