import React from 'react';
import { Switch } from 'react-native';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { SettingsItem } from './SettingsItem';

export interface ToggleSettingProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({
  title,
  description,
  value,
  onValueChange,
}) => {
  const { colors } = useTheme();

  return (
    <SettingsItem title={title} description={description}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primaryLight, false: colors.border }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </SettingsItem>
  );
};

