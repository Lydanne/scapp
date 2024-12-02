import qrcodeParser from 'qrcode-parser';
import React from 'react';

import { type StandardProps, View } from '@tarojs/components';

type AcameraProps = {
  onScanCode?: (e: { detail: { result: string } }) => void;
  devicePosition?: 'back' | 'front';
  flash?: 'off' | 'on' | 'auto';
  mode?: 'scanCode' | 'normal';
} & StandardProps;

export default function Acamera(props: AcameraProps) {
  const init = React.useRef(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const videoWrapRef = React.useRef<HTMLVideoElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 480 });

  React.useEffect(() => {
    if (!videoWrapRef.current) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: size.width,
            height: size.height,
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 获取视频帧
        if (videoRef.current && props.mode === 'scanCode') {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          const captureFrame = async () => {
            if (!init.current) return;
            try {
              if (!videoRef.current || !context) return;

              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;

              context.drawImage(
                videoRef.current,
                0,
                0,
                canvas.width,
                canvas.height,
              );

              const frame = canvas.toDataURL('image/jpeg');

              const base64Result = await qrcodeParser(frame);

              // console.log('base64Result', base64Result);

              if (props.onScanCode) {
                props.onScanCode({ detail: { result: base64Result } });
              }
            } catch (err) {
              // console.error('捕获视频帧失败:', err);
            }

            setTimeout(captureFrame, 1000);
          };

          setTimeout(captureFrame, 1000);
        }
      } catch (err) {
        console.error('相机启动失败:', err);
      }
    };

    startCamera();

    return () => {
      // 组件卸载时关闭相机
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [size.width, size.height]);

  React.useEffect(() => {
    init.current = true;
    setTimeout(() => {
      if (videoWrapRef.current) {
        setSize({
          width: videoWrapRef.current.clientWidth,
          height: videoWrapRef.current.clientHeight,
        });
      }
    }, 1);
    return () => {
      init.current = false;
    };
  }, []);

  return (
    <View ref={videoWrapRef} {...props}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: size.width,
          height: size.height,
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
      />
    </View>
  );
}
