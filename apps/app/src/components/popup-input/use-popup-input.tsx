import React, { useCallback, useMemo, useState } from 'react';

import { PopupInput } from './popup-input';

interface PopupInputOptions {
  title?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

interface UsePopupInputReturn {
  PopupInputElement: React.MemoExoticComponent<() => JSX.Element>;
  showPopupInput: (options?: PopupInputOptions) => Promise<string | null>;
}

export function usePopupInput(): UsePopupInputReturn {
  const resolverRef = React.useRef<
    ((value: string | null) => void) | undefined
  >();

  const [state, setState] = useState<{
    visible: boolean;
    options: PopupInputOptions;
  }>({
    visible: false,
    options: {},
  });

  const showPopupInput = useCallback((customOptions?: PopupInputOptions) => {
    setState((prev) => ({
      ...prev,
      visible: true,
      options: customOptions || {},
    }));

    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, visible: false }));
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = undefined;
    }
  }, []);

  const handleCancelOrClose = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
    if (resolverRef.current) {
      resolverRef.current(null);
      resolverRef.current = undefined;
    }
  }, []);

  const popupProps = useMemo(
    () => ({
      visible: state.visible,
      title: state.options.title,
      placeholder: state.options.placeholder,
      confirmText: state.options.confirmText,
      cancelText: state.options.cancelText,
      onConfirm: handleConfirm,
      onCancel: handleCancelOrClose,
      onClose: handleCancelOrClose,
    }),
    [state.visible, state.options, handleConfirm, handleCancelOrClose],
  );

  const PopupInputElement = React.memo(() => {
    return <PopupInput {...popupProps} />;
  });

  PopupInputElement.displayName = 'PopupInputElement';

  return useMemo(
    () => ({
      PopupInputElement,
      showPopupInput,
    }),
    [PopupInputElement, showPopupInput],
  );
}
