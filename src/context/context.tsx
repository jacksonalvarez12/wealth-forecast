import { createContext } from 'react';
import type { AppContextType } from '../types/context';

export const AppContext = createContext<AppContextType | undefined>(undefined);
