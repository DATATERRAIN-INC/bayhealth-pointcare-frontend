"use client";

import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { maskEmail } from "@/lib/authUtils";

export function ForgotPasswordPageView() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const step = email ? "reset" : "request";

  function handleRequestSuccess(result: { email: string; message: string }) {
    setEmail(result.email);
    setStatusMessage(result.message);
  }

  function handleUseDifferentEmail() {
    setEmail("");
    setStatusMessage("");
  }

  return (
    <AuthShell
      title={step === "request" ? "Reset password" : "Reset your password"}
      subtitle={
        step === "request"
          ? "Enter your email and we will send you a verification code."
          : `Enter the 6-digit code sent to ${maskEmail(email)} and choose a new password.`
      }
    >
      {step === "request" ? (
        <ForgotPasswordForm onSuccess={handleRequestSuccess} />
      ) : (
        <ResetPasswordForm
          email={email}
          initialMessage={statusMessage}
          onUseDifferentEmail={handleUseDifferentEmail}
        />
      )}
    </AuthShell>
  );
}
