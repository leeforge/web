import type { LottieRefCurrentProps } from 'lottie-react';
import type { CSSProperties } from 'react';
import Lottie from 'lottie-react';
import { useEffect, useRef } from 'react';

export interface LottieAnimationProps {
  animationData: any;
  name: string;
  width?: number;
  height?: number;
  renderer?: 'svg';
  loop?: boolean;
  autoplay?: boolean;
  style?: CSSProperties;
  speed?: number;
  left?: number;
  top?: number;
  clickReplay?: boolean;
}

export default function LottieAnimation(props: LottieAnimationProps) {
  const {
    animationData,
    name,
    width,
    height,
    renderer = 'svg',
    loop = true,
    autoplay = true,
    style,
    speed,
    clickReplay,
  } = props;

  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  const play = () => {
    if (!lottieRef.current)
      return;
    lottieRef.current.stop();
    lottieRef.current.play();
  };

  useEffect(() => {
    if (speed && lottieRef.current)
      lottieRef.current.setSpeed(speed);
  }, [speed, animationData]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      name={name}
      renderer={renderer}
      loop={loop}
      autoplay={autoplay}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        ...style,
      }}
      onClick={() => {
        if (clickReplay)
          play();
      }}
    />
  );
}
