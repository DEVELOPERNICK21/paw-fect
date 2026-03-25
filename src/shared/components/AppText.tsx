import React from 'react';
import { Text, type TextProps } from 'react-native';

type AppTextProps = TextProps;

export const AppText: React.FC<AppTextProps> = ({
  allowFontScaling = false,
  maxFontSizeMultiplier = 1,
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
