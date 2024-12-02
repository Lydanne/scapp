import { Camera, type StandardProps, View } from '@tarojs/components';

type AcameraProps = {
  onScanCode?: (e: { detail: { result: string } }) => void;
  devicePosition?: 'back' | 'front';
  flash?: 'off' | 'on' | 'auto';
  mode?: 'scanCode' | 'normal';
} & StandardProps;

export default function Acamera(props: AcameraProps) {
  return <Camera {...props} />;
}
