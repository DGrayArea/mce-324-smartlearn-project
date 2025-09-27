/**
 * Mobile-specific authentication utilities
 * Handles navigation issues on mobile devices
 */

export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
};

export const forceMobileNavigation = (url: string): void => {
  if (typeof window === "undefined") return;

  if (isMobile()) {
    // Use window.location for mobile to ensure proper navigation
    window.location.href = url;
  } else {
    // Use router for desktop
    window.location.href = url;
  }
};

export const handleMobileCallback = (): void => {
  if (typeof window === "undefined") return;

  if (isMobile()) {
    // Add a small delay to ensure the session is properly set
    setTimeout(() => {
      const currentPath = window.location.pathname;
      if (currentPath === "/" || currentPath === "/login") {
        window.location.href = "/dashboard";
      }
    }, 100);
  }
};

export const setupMobileAuthListener = (): void => {
  if (typeof window === "undefined") return;

  // Listen for storage events (session changes)
  window.addEventListener("storage", (e) => {
    if (e.key === "next-auth.session-token" && isMobile()) {
      // Session token changed, redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    }
  });

  // Listen for focus events (app coming back to foreground)
  window.addEventListener("focus", () => {
    if (isMobile()) {
      // Check if we're on login page but should be on dashboard
      const currentPath = window.location.pathname;
      if (
        currentPath === "/login" &&
        localStorage.getItem("next-auth.session-token")
      ) {
        window.location.href = "/dashboard";
      }
    }
  });
};
