import React from 'react';
import { Text, type TextProps } from 'react-native';

type AppTextProps = TextProps;

/** Cap Dynamic Type so dense rows can grow without blowing the layout. */
const DEFAULT_MAX_FONT_SIZE_MULTIPLIER = 1.4;

export const AppText: React.FC<AppTextProps> = ({
  allowFontScaling = true,
  maxFontSizeMultiplier = DEFAULT_MAX_FONT_SIZE_MULTIPLIER,
  ...rest
}) => {
  return (
    <Text
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...rest}
    />
  );
};

export default AppText;
