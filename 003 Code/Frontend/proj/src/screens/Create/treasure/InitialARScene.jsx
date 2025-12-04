// src/screens/Play/Treasure/InitialARScene.tsx
import React from 'react';
import {
  ViroARScene,
  ViroAmbientLight,
  Viro3DObject,
} from '@reactvision/react-viro';

// ⚠️ 경로는 실제 ar_model 위치에 맞게 수정할 것
const CHEST_OBJ = require('../../../ar_model/chest.obj');
const CHEST_MTL = require('../../../ar_model/chest.mtl');
const CHEST_TEX = require('../../../ar_model/colormap.png');

export default function InitialARScene() {
  return (
    <ViroARScene>
      {/* <ViroAmbientLight color="#ffffff" intensity={700} />

      <Viro3DObject
        source={CHEST_OBJ}
        resources={[CHEST_MTL, CHEST_TEX]}
        position={[0, -0.2, -1]} // 카메라 앞 1m, 약간 아래
        scale={[0.2, 0.2, 0.2]} // 필요하면 크기 조절
        rotation={[0, 0, 0]}
        type="OBJ"
      /> */}
    </ViroARScene>
  );
}
