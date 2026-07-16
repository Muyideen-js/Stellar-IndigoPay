/**
 * hooks/useDeepLink.ts
 * Handles indigopay:// deep links and navigates to the correct screen.
 *
 * Supported URLs:
 *   indigopay://project/123       → /projects/123
 *   indigopay://donate/G...ABC    → /donate/G...ABC  (address pre-selects via id param)
 */
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { parseDeepLinkUrl } from "../utils/notifications";

export function useDeepLink() {
  const router = useRouter();

  function handleUrl(url: string | null) {
    if (!url) return;
    const path = parseDeepLinkUrl(url);
    if (path) {
      router.push(path as any);
    }
  }

  useEffect(() => {
    // Handle the link that launched the app (cold start)
    Linking.getInitialURL().then(handleUrl);

    // Handle links received while the app is already open
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url),
    );
    return () => subscription.remove();
  }, []);
}
