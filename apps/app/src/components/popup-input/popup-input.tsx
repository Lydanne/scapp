import React from 'react';

import { Button, Input, Popup } from '@nutui/nutui-react-taro';

import styles from './popup-input.module.scss';

interface PopupInputProps {
  visible: boolean;
  title?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const PopupInput = React.memo<PopupInputProps>(
  ({
    visible,
    title = '请输入',
    placeholder = '请输入内容',
    confirmText = '确认',
    cancelText = '取消',
    onConfirm,
    onCancel,
    onClose,
  }) => {
    const [value, setValue] = React.useState('');

    React.useEffect(() => {
      if (!visible) {
        setValue('');
      }
    }, [visible]);

    const handleConfirm = React.useCallback(() => {
      onConfirm?.(value);
    }, [value, onConfirm]);

    const handleInputChange = React.useCallback((val: string) => {
      setValue(val);
    }, []);

    return (
      <Popup
        visible={visible}
        position="bottom"
        onClose={onClose}
        className={styles.popup}
        round
        destroyOnClose
      >
        <div className={styles.header}>{title}</div>
        <div className={styles.inputWrapper}>
          <Input
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            type="text"
            autoFocus
          />
        </div>
        <div className={styles.buttonGroup}>
          <Button block fill="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button block type="primary" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </Popup>
    );
  },
);

PopupInput.displayName = 'PopupInput';
