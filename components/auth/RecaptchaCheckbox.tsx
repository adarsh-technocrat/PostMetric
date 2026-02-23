"use client";

import { useCallback, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export function RecaptchaCheckbox({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string | null) => void;
  onExpire?: () => void;
}) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleChange = useCallback(
    (token: string | null) => {
      onVerify(token);
    },
    [onVerify],
  );

  const handleExpired = useCallback(() => {
    onVerify(null);
    onExpire?.();
  }, [onVerify, onExpire]);

  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  return (
    <div className="flex justify-start">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={RECAPTCHA_SITE_KEY}
        onChange={handleChange}
        onExpired={handleExpired}
        onErrored={handleExpired}
        theme="light"
        size="normal"
      />
    </div>
  );
}

export function useRecaptchaRequired() {
  return !!RECAPTCHA_SITE_KEY;
}
