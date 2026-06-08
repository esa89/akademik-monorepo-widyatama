import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GraduateProfile } from '@/types';

const PROFILE_STORAGE_KEY = 'fe-jurusan:selectedProfileId';

interface AppContextValue {
  /** UUID of the study program for this deployment (from VITE_STUDY_PROGRAM_ID). null = all. */
  studyProgramId: string | null;
  /** Display name of the study program (from VITE_STUDY_PROGRAM_NAME). */
  studyProgramName: string | null;
  /** Currently selected curriculum / graduate profile. */
  selectedProfile: GraduateProfile | null;
  setSelectedProfile: (profile: GraduateProfile | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const studyProgramId   = import.meta.env.VITE_STUDY_PROGRAM_ID   || null;
  const studyProgramName = import.meta.env.VITE_STUDY_PROGRAM_NAME || null;

  const [selectedProfile, setSelectedProfileState] = useState<GraduateProfile | null>(null);

  const setSelectedProfile = (profile: GraduateProfile | null) => {
    setSelectedProfileState(profile);
    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, profile.id);
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  };

  return (
    <AppContext.Provider value={{ studyProgramId, studyProgramName, selectedProfile, setSelectedProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

/** Expose the stored profile ID so CurriculumDropdown can auto-restore it. */
export function getStoredProfileId(): string | null {
  try { return localStorage.getItem(PROFILE_STORAGE_KEY); } catch { return null; }
}
