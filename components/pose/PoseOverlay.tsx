import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { PoseLandmark } from '../../hooks/useQuickPose';

type Props = {
  landmarks: PoseLandmark[];
  width: number;
  height: number;
  mirrored?: boolean;
};

const CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [15, 17],
  [16, 18],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
];

const PoseOverlay: React.FC<Props> = ({ landmarks, width, height, mirrored }) => {
  if (!landmarks.length || !width || !height) {
    return null;
  }

  const projectX = (value: number) => {
    const x = value * width;
    return mirrored ? width - x : x;
  };

  const projectY = (value: number) => value * height;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.container]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {CONNECTIONS.map(([start, end]) => {
          const a = landmarks[start];
          const b = landmarks[end];

          if (!a || !b) return null;

          return (
            <Line
              key={`line-${start}-${end}`}
              x1={projectX(a.x)}
              y1={projectY(a.y)}
              x2={projectX(b.x)}
              y2={projectY(b.y)}
              stroke="#6ee7b7"
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.9}
            />
          );
        })}

        {landmarks.map((landmark, index) => (
          <Circle
            key={`landmark-${index}`}
            cx={projectX(landmark.x)}
            cy={projectY(landmark.y)}
            r={6}
            fill="#22d3ee"
            opacity={0.9}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PoseOverlay;
