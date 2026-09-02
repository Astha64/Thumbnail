import React from 'react';
import { StyleName } from '../../types/api';
import { Badge } from '../ui/Badge';

interface StyleBadgeProps {
  styleName: StyleName;
}

const styleLabels: Record<StyleName, string> = {
  bold_dramatic: 'Bold & Dramatic',
  clean_minimal: 'Clean & Minimal',
  vibrant_energetic: 'Vibrant & Energetic',
};

const styleTones: Record<StyleName, 'brand' | 'info' | 'success'> = {
  bold_dramatic: 'brand',
  clean_minimal: 'info',
  vibrant_energetic: 'success',
};

export const StyleBadge: React.FC<StyleBadgeProps> = ({ styleName }) => {
  return (
    <Badge tone={styleTones[styleName] || 'default'}>
      {styleLabels[styleName] || styleName}
    </Badge>
  );
};
