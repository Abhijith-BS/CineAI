"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

interface SignOutButtonProps {
  onSignOut?: () => void; // Callback to handle redirect to landing page
}

export function SignOutButton({ onSignOut }: SignOutButtonProps) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  // Handle sign out with redirect callback
  const handleSignOut = async () => {
    await signOut();
    // Call the callback to reset app state and show landing page
    if (onSignOut) {
      onSignOut();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={() => void handleSignOut()}
    >
      Sign out
    </button>
  );
}
