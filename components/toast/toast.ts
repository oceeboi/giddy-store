import { toastDispatchRef, ToastOptions, ToastType } from './toast-context';

function requireDispatch() {
  const dispatch = toastDispatchRef.current;
  if (!dispatch) {
    throw new Error(
      'toast() called before ToastProvider mounted — wrap your app in <ToastProvider>.'
    );
  }
  return dispatch;
}

function emit(type: ToastType, message: string, options?: ToastOptions) {
  return requireDispatch().add(type, message, options);
}

export const toast = {
  pending: (message: string, options?: ToastOptions) => emit('pending', message, options),
  success: (message: string, options?: ToastOptions) => emit('success', message, options),
  error: (message: string, options?: ToastOptions) => emit('error', message, options),
  info: (message: string, options?: ToastOptions) => emit('info', message, options),

  dismiss: (id: string) => requireDispatch().remove(id, 'programmatic'),

  // Ties a pending -> success/error transition to ONE toast id, so the card
  // morphs in place instead of one toast disappearing and a new one popping in.
  promise<T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string | ((result: T) => string);
      error: string | ((err: unknown) => string);
      duration?: { success?: number; error?: number };
    },
    options?: Omit<ToastOptions, 'duration'>
  ): Promise<T> {
    const dispatch = requireDispatch();
    const id = dispatch.add('pending', messages.pending, { ...options, duration: Infinity });

    return promise
      .then((result) => {
        const successMessage =
          typeof messages.success === 'function' ? messages.success(result) : messages.success;
        dispatch.update(id, {
          type: 'success',
          message: successMessage,
          duration: messages.duration?.success ?? 4000,
        });
        return result;
      })
      .catch((err) => {
        const errorMessage =
          typeof messages.error === 'function' ? messages.error(err) : messages.error;
        dispatch.update(id, {
          type: 'error',
          message: errorMessage,
          duration: messages.duration?.error ?? 6000,
        });
        throw err;
      });
  },
};
