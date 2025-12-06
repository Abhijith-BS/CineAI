"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

interface SignInFormProps {
  onSignInStart?: () => void;
}

export function SignInForm({ onSignInStart }: SignInFormProps) {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"

        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          onSignInStart?.();

          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get("email") as string;

          const attemptAuth = async () => {
            if (flow === "signUp") {
              // Check if user already exists
              const userExists = await convex.query(api.users.checkUserExists, { email });
              if (userExists) {
                toast.error("This account is already registered, try sign in");
                setSubmitting(false);
                return;
              }
            }

            // Proceed with auth
            formData.set("flow", flow);
            try {
              await signIn("password", formData);
              // Sign in successful - loading handled by App.tsx
            } catch (error: any) {
              let toastTitle = "";
              if (error.message.includes("Invalid password")) {
                toastTitle = "Invalid password. Please try again.";
              } else {
                toastTitle =
                  flow === "signIn"
                    ? "Could not sign in, did you mean to sign up?"
                    : "Could not sign up, did you mean to sign in?";
              }
              toast.error(toastTitle);
              setSubmitting(false);
            }
          };

          // Use setTimeout just to allow the UI to update with loading state first (from onSignInStart)
          setTimeout(() => {
            void attemptAuth();
          }, 0);
        }}
      >
        {flow === "signUp" && (
          <input
            className="auth-input-field"
            type="text"
            name="name"
            placeholder="Full Name"
            required
          />
        )}
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button
        className="auth-button"
        onClick={() => {
          onSignInStart?.();
          setTimeout(() => {
            void signIn("anonymous");
          }, 0);
        }}
      >
        Sign in anonymously
      </button>
    </div>
  );
}
