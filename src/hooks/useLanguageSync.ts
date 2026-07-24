import { useEffect } from 'react';
import i18n, { setActiveLanguage } from '../i18n';
import { isLanguage } from '../i18n/resolve';
import { useProfile } from './useProfile';

/**
 * Applies the backend profile language once it loads. Source of truth per the
 * resolution chain: profile > cache > browser locale > fallback.
 */
export function useLanguageSync(): void {
  const { data } = useProfile();
  const profileLanguage = data?.language;

  useEffect(() => {
    if (isLanguage(profileLanguage) && profileLanguage !== i18n.language) {
      setActiveLanguage(profileLanguage);
    }
  }, [profileLanguage]);
}
