import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Curriculum } from '@/types';

const CURRICULUM_STORAGE_KEY = 'fe-jurusan:selectedCurriculumId';

interface AppContextValue {
  /** UUID of the study program for this deployment (from VITE_STUDY_PROGRAM_ID). null = all. */
  studyProgramId: string | null;
  /** Display name of the study program (from VITE_STUDY_PROGRAM_NAME). */
  studyProgramName: string | null;
  /** Currently selected curriculum (from api-akademik). */
  selectedCurriculum: Curriculum | null;
  setSelectedCurriculum: (curriculum: Curriculum | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const studyProgramId   = import.meta.env.VITE_STUDY_PROGRAM_ID   || null;
  const studyProgramName = import.meta.env.VITE_STUDY_PROGRAM_NAME || null;

  const [selectedCurriculum, setSelectedCurriculumState] = useState<Curriculum | null>(null);

  const setSelectedCurriculum = (curriculum: Curriculum | null) => {
    setSelectedCurriculumState(curriculum);
    if (curriculum) {
      localStorage.setItem(CURRICULUM_STORAGE_KEY, curriculum.id);
    } else {
      localStorage.removeItem(CURRICULUM_STORAGE_KEY);
    }
  };

  return (
    <AppContext.Provider value={{ studyProgramId, studyProgramName, selectedCurriculum, setSelectedCurriculum }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

/** Expose the stored curriculum ID so CurriculumDropdown can auto-restore it. */
export function getStoredCurriculumId(): string | null {
  try { return localStorage.getItem(CURRICULUM_STORAGE_KEY); } catch { return null; }
}
