import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

/**
 * Hook to check if the current user can edit an agent
 * 
 * Rules:
 * 1. Admin users can edit all agents
 * 2. Regular users can only edit agents they created
 * 3. Regular users cannot see system prompts of admin-published agents
 */
export const useCanEditAgent = () => {
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);

  // If no session is selected, no permissions
  if (!currentSession) {
    return {
      canEdit: false,
      canViewSystemRole: false,
      isOwnAgent: false,
      isDomainAgent: false,
    };
  }

  // Check if this is a domain agent (published by admin)
  const isDomainAgent = currentSession.isDomain || false;
  
  // Check if the agent belongs to the current user
  const isOwnAgent = currentSession.userId === currentUserId;

  // Admin can edit and view everything
  if (isAdmin) {
    return {
      canEdit: true,
      canViewSystemRole: true,
      isOwnAgent,
      isDomainAgent,
    };
  }

  // Regular users can only edit their own agents
  // and cannot view system roles of domain agents
  return {
    canEdit: isOwnAgent,
    canViewSystemRole: isOwnAgent || !isDomainAgent,
    isOwnAgent,
    isDomainAgent,
  };
};