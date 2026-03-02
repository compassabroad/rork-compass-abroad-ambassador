import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { SocialMediaLinks } from '@/types';

const DEFAULT_SOCIAL_MEDIA_LINKS: SocialMediaLinks = {
  instagram: 'https://instagram.com/compassabroad',
  linkedin: 'https://linkedin.com/company/compassabroad',
  twitter: 'https://twitter.com/compassabroad',
  facebook: 'https://facebook.com/compassabroad',
};

const STORAGE_KEY = 'social_media_links';

export const [SocialMediaProvider, useSocialMedia] = createContextHook(() => {
  const [links, setLinks] = useState<SocialMediaLinks>(DEFAULT_SOCIAL_MEDIA_LINKS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SocialMediaLinks;
        setLinks(parsed);
        console.log('Social media links loaded from storage:', parsed);
      } else {
        console.log('No stored social media links, using defaults');
      }
    } catch (error) {
      console.error('Error loading social media links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLinks = useCallback(async (newLinks: SocialMediaLinks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
      setLinks(newLinks);
      console.log('Social media links saved:', newLinks);
      return true;
    } catch (error) {
      console.error('Error saving social media links:', error);
      return false;
    }
  }, []);

  const resetLinks = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SOCIAL_MEDIA_LINKS));
      setLinks(DEFAULT_SOCIAL_MEDIA_LINKS);
      console.log('Social media links reset to defaults');
      return true;
    } catch (error) {
      console.error('Error resetting social media links:', error);
      return false;
    }
  }, []);

  return {
    links,
    isLoading,
    updateLinks,
    resetLinks,
  };
});
