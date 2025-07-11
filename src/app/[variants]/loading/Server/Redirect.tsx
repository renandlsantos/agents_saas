'use client';

import { useParams, useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';

import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

import { AppLoadingStage } from '../stage';

interface RedirectProps {
  setLoadingStage: (value: AppLoadingStage) => void;
}

const Redirect = memo<RedirectProps>(({ setLoadingStage }) => {
  const router = useRouter();
  const params = useParams();
  const [isLogin, isLoaded, isUserStateInit, isOnboard] = useUserStore((s) => [
    authSelectors.isLogin(s),
    authSelectors.isLoaded(s),
    s.isUserStateInit,
    s.isOnboard,
  ]);

  const navToChat = () => {
    setLoadingStage(AppLoadingStage.GoToChat);
    // Get the current variant from params if available
    const variant = params?.variants as string;
    if (variant) {
      // If we're already in a variant path, navigate to the chat within that variant
      router.replace(`/${variant}/chat`);
    } else {
      // Otherwise, use the simple redirect that will be handled by middleware
      router.replace('/chat');
    }
  };

  useEffect(() => {
    // if user auth state is not ready, wait for loading
    if (!isLoaded) {
      setLoadingStage(AppLoadingStage.InitAuth);
      return;
    }

    // this mean user is definitely not login
    if (!isLogin) {
      navToChat();
      return;
    }

    // if user state not init, wait for loading
    if (!isUserStateInit) {
      setLoadingStage(AppLoadingStage.InitUser);
      return;
    }

    // user need to onboard
    if (!isOnboard) {
      router.replace('/onboard');
      return;
    }

    // finally go to chat
    navToChat();
  }, [isUserStateInit, isLoaded, isOnboard, isLogin]);

  return null;
});

export default Redirect;
