import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
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
  const agent = useAgentStore(agentSelectors.currentAgentItem);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);

  // If no agent is selected, no permissions
  if (!agent) {
    return {
      canEdit: false,
      canViewSystemRole: false,
      isOwnAgent: false,
    };
  }

  // Check if the agent belongs to the current user
  const isOwnAgent = agent.userId === currentUserId;

  // Admin can edit and view everything
  if (isAdmin) {
    return {
      canEdit: true,
      canViewSystemRole: true,
      isOwnAgent,
    };
  }

  // Regular users can only edit their own agents
  return {
    canEdit: isOwnAgent,
    canViewSystemRole: isOwnAgent,
    isOwnAgent,
  };
};