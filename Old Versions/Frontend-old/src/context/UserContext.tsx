import React, { createContext, useState, useContext } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
}

interface FocusSession {
  id: string;
  childId: string;
  date: string;
  duration: number;
  focusScore: number;
  emotions: {
    happy: number;
    neutral: number;
    distracted: number;
  };
}

interface UserContextType {
  children: Child[];
  addChild: (child: Child) => void;
  updateChild: (child: Child) => void;
  selectedChild: Child | null;
  selectChild: (childId: string) => void;
  sessions: FocusSession[];
  addSession: (session: FocusSession) => void;
  isParentMode: boolean;
  toggleParentMode: () => void;
}

const generateDefaultAvatar = (seed: string) => {
  const avatar = createAvatar(adventurer, {
    seed,
    backgroundColor: ['b6e3f4', 'c0aede'],
    backgroundType: ['solid'],
    size: 128,
  });
  return avatar.toDataUriSync();
};

const defaultChildren: Child[] = [
  {
    id: '1',
    name: 'Emma',
    age: 8,
    avatar: generateDefaultAvatar('emma')
  },
  {
    id: '2',
    name: 'Liam',
    age: 9,
    avatar: generateDefaultAvatar('liam')
  }
];

const defaultSessions: FocusSession[] = [
  {
    id: '1',
    childId: '1',
    date: '2023-06-01',
    duration: 25,
    focusScore: 82,
    emotions: {
      happy: 60,
      neutral: 30,
      distracted: 10
    }
  },
  {
    id: '2',
    childId: '1',
    date: '2023-06-02',
    duration: 30,
    focusScore: 75,
    emotions: {
      happy: 50,
      neutral: 35,
      distracted: 15
    }
  },
  {
    id: '3',
    childId: '2',
    date: '2023-06-01',
    duration: 20,
    focusScore: 65,
    emotions: {
      happy: 40,
      neutral: 40,
      distracted: 20
    }
  }
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [childrenState, setChildren] = useState<Child[]>(defaultChildren);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>(defaultSessions);
  const [isParentMode, setIsParentMode] = useState(false);

  const addChild = (child: Child) => {
    setChildren([...childrenState, child]);
  };

  const updateChild = (updatedChild: Child) => {
    setChildren(childrenState.map(child => 
      child.id === updatedChild.id ? updatedChild : child
    ));
  };

  const selectChild = (childId: string) => {
    const child = childrenState.find(c => c.id === childId) || null;
    setSelectedChild(child);
  };

  const addSession = (session: FocusSession) => {
    setSessions([...sessions, session]);
  };

  const toggleParentMode = () => {
    setIsParentMode(!isParentMode);
  };

  return (
    <UserContext.Provider
      value={{
        children: childrenState,
        addChild,
        updateChild,
        selectedChild,
        selectChild,
        sessions,
        addSession,
        isParentMode,
        toggleParentMode
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};