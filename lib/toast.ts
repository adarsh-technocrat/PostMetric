import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (
    message: string,
    opts?: Parameters<typeof sonnerToast.success>[1],
  ) => sonnerToast.success(message, opts),
  error: (message: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, opts),
  warning: (
    message: string,
    opts?: Parameters<typeof sonnerToast.warning>[1],
  ) => sonnerToast.warning(message, opts),
  info: (message: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, opts),
  loading: (
    message: string,
    opts?: Parameters<typeof sonnerToast.loading>[1],
  ) => sonnerToast.loading(message, opts),
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
  dismiss: sonnerToast.dismiss,
};
