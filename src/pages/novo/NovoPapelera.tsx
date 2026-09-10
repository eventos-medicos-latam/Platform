import React from 'react';
import { Trash } from '../admin/Trash';
import { NovoLightFrame } from './NovoLightFrame';

export function NovoPapelera() {
  return (
    <NovoLightFrame>
      <Trash />
    </NovoLightFrame>
  );
}
