// src/context/UserContext.tsx
// Fixed to properly load children after login

import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiService, ChildResponse, ChildCreate, ChildUpdate } from '../services/apiService';

// ===========================
// TYPES
// ===========================

interface User {
  id: string;
  email: string;
  fullName: string;
  token: string;
}

interface Child {
  id: string;
  name: string;
  age: number;
  parentId: string;
  avatar: string;
  seed: string;
  createdAt: string;
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
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Child management
  children: Child[];
  selectedChild: Child | null;
  childrenLoading: boolean;
  childrenError: string | null;
  
  // Auth methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  
  // Child methods
  loadChildren: (userId?: string) => Promise<void>;
  addChild: (childData: Omit<ChildCreate, 'parentId'>) => Promise<Child | null>;
  updateChild: (childId: string, updateData: ChildUpdate) => Promise<Child | null>;
  deleteChild: (childId: string) => Promise<boolean>;
  selectChild: (childId: string) => void;
  
  // Legacy compatibility
  sessions: FocusSession[];
  addSession: (session: FocusSession) => void;
  isParentMode: boolean;
  toggleParentMode: () => void;
}

// ===========================
// CONTEXT CREATION
// ===========================

const UserContext = createContext<UserContextType | undefined>(undefined);

// ===========================
// PROVIDER COMPONENT
// ===========================

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Children state
  const [childrenState, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  
  // Legacy state for compatibility
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isParentMode, setIsParentMode] = useState(false);

  // ===========================
  // INITIALIZATION
  // ===========================

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for stored user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        apiService.setAuthToken(userData.token);
        
        // Load children for authenticated user
        await loadChildren(userData.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      apiService.clearAuthToken();
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // AUTH METHODS
  // ===========================

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      const result = await apiService.login({ email, password, rememberMe });
      
      if (result.success && result.data) {
        const userData: User = {
          id: result.data.user_id,
          email: result.data.email,
          fullName: result.data.full_name,
          token: result.data.access_token
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Load children using the user ID directly (not waiting for state update)
        await loadChildren(userData.id);
        
        return true;
      } else {
        console.error('Login failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setChildren([]);
    setSelectedChild(null);
    localStorage.removeItem('user');
    apiService.logout();
  };

  // ===========================
  // CHILD MANAGEMENT METHODS
  // ===========================

  const loadChildren = async (userId?: string): Promise<void> => {
    // Use provided userId or fall back to current user
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      console.warn('No user ID available for loading children');
      return;
    }

    setChildrenLoading(true);
    setChildrenError(null);

    try {
      console.log('🔄 Loading children for parent:', targetUserId);
      
      const result = await apiService.getChildrenByParent(targetUserId);
      
      if (result.success && result.data) {
        const childrenData = result.data.children || [];
        console.log('✅ Children loaded:', childrenData.length, 'children');
        
        // Convert backend response to frontend format
        const formattedChildren: Child[] = childrenData.map((child: ChildResponse) => ({
          id: child.id,
          name: child.name,
          age: child.age,
          parentId: child.parentId,
          avatar: child.avatar,
          seed: child.seed,
          createdAt: child.createdAt
        }));
        
        setChildren(formattedChildren);
        
        // If no child is selected but we have children, select the first one
        if (!selectedChild && formattedChildren.length > 0) {
          setSelectedChild(formattedChildren[0]);
        }
      } else {
        console.error('Failed to load children:', result.error);
        setChildrenError(result.error || 'Failed to load children');
      }
    } catch (error) {
      console.error('Error loading children:', error);
      setChildrenError('An unexpected error occurred while loading children');
    } finally {
      setChildrenLoading(false);
    }
  };

  const addChild = async (childData: Omit<ChildCreate, 'parentId'>): Promise<Child | null> => {
    if (!user?.id) {
      console.error('No user ID available for creating child');
      return null;
    }

    try {
      console.log('➕ Creating child:', childData);
      
      const result = await apiService.createChild({
        ...childData,
        parentId: user.id
      });

      if (result.success && result.data) {
        const newChild: Child = {
          id: result.data.id,
          name: result.data.name,
          age: result.data.age,
          parentId: result.data.parentId,
          avatar: result.data.avatar,
          seed: result.data.seed,
          createdAt: result.data.createdAt
        };

        setChildren(prev => [...prev, newChild]);
        console.log('✅ Child created successfully:', newChild);
        
        return newChild;
      } else {
        console.error('Failed to create child:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating child:', error);
      return null;
    }
  };

  const updateChild = async (childId: string, updateData: ChildUpdate): Promise<Child | null> => {
    try {
      console.log('✏️ Updating child:', childId, updateData);
      
      const result = await apiService.updateChild(childId, updateData);

      if (result.success && result.data?.child) {
        const updatedChild: Child = {
          id: result.data.child.id,
          name: result.data.child.name,
          age: result.data.child.age,
          parentId: result.data.child.parentId,
          avatar: result.data.child.avatar,
          seed: result.data.child.seed,
          createdAt: result.data.child.createdAt
        };

        setChildren(prev => 
          prev.map(child => child.id === childId ? updatedChild : child)
        );

        // Update selected child if it's the one being updated
        if (selectedChild?.id === childId) {
          setSelectedChild(updatedChild);
        }

        console.log('✅ Child updated successfully:', updatedChild);
        return updatedChild;
      } else {
        console.error('Failed to update child:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error updating child:', error);
      return null;
    }
  };

  const deleteChild = async (childId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting child:', childId);
      
      const result = await apiService.deleteChild(childId);

      if (result.success) {
        setChildren(prev => prev.filter(child => child.id !== childId));
        
        // Clear selected child if it's the one being deleted
        if (selectedChild?.id === childId) {
          setSelectedChild(null);
        }

        console.log('✅ Child deleted successfully');
        return true;
      } else {
        console.error('Failed to delete child:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error deleting child:', error);
      return false;
    }
  };

  const selectChild = (childId: string) => {
    const child = childrenState.find(c => c.id === childId) || null;
    setSelectedChild(child);
    console.log('👶 Selected child:', child?.name);
  };

  // ===========================
  // LEGACY METHODS (for compatibility)
  // ===========================

  const addSession = (session: FocusSession) => {
    setSessions(prev => [...prev, session]);
  };

  const toggleParentMode = () => {
    setIsParentMode(!isParentMode);
  };

  // ===========================
  // CONTEXT VALUE
  // ===========================

  const contextValue: UserContextType = {
    // Auth state
    user,
    isAuthenticated: !!user,
    loading,
    
    // Child state
    children: childrenState,
    selectedChild,
    childrenLoading,
    childrenError,
    
    // Auth methods
    login,
    logout,
    
    // Child methods
    loadChildren,
    addChild,
    updateChild,
    deleteChild,
    selectChild,
    
    // Legacy compatibility
    sessions,
    addSession,
    isParentMode,
    toggleParentMode
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// ===========================
// HOOK
// ===========================

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};