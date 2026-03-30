import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { HealthSchedule } from '../../domain/models/HealthSchedule';
import { HealthScheduleEngine } from '../../domain/utils/HealthScheduleEngine';

export interface HealthTaskCardProps {
  schedule: HealthSchedule;
  onComplete?: (scheduleId: string) => void;
  onSkip?: (scheduleId: string) => void;
  onEdit?: (scheduleId: string) => void;
  showPetName?: boolean;
  petName?: string;
}

export const HealthTaskCard: React.FC<HealthTaskCardProps> = ({
  schedule,
  onComplete,
  onSkip,
  onEdit,
  showPetName = false,
  petName,
}) => {
  const { colors, fontFamilies } = useTheme();

  const urgency = HealthScheduleEngine.getUrgency(
    schedule.nextDueDate,
    schedule.status,
  );
  const daysUntil = HealthScheduleEngine.getDaysUntilDue(schedule.nextDueDate);
  const urgencyColor = HealthScheduleEngine.getUrgencyColor(urgency);
  const urgencyText = HealthScheduleEngine.formatUrgencyDisplay(
    urgency,
    daysUntil,
  );

  const getTaskIcon = (): 'vaccines' | 'pill' => {
    if (schedule.taskType === 'deworming') {
      return 'pill';
    }
    return 'vaccines';
  };

  const handleComplete = useCallback(() => {
    onComplete?.(schedule.id);
  }, [onComplete, schedule.id]);

  const handleSkip = useCallback(() => {
    onSkip?.(schedule.id);
  }, [onSkip, schedule.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(schedule.id);
  }, [onEdit, schedule.id]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: schedule.isEnabled ? 1 : 0.5,
        },
      ]}
    >
      <View
        style={[styles.statusIndicator, { backgroundColor: urgencyColor }]}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcon name={getTaskIcon()} size={24} color={urgencyColor} />
          </View>
          <View style={styles.headerText}>
            <Text
              style={[
                styles.taskName,
                { fontFamily: fontFamilies.bold, color: colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {schedule.taskName}
            </Text>
            {showPetName && petName && (
              <Text
                style={[
                  styles.petName,
                  {
                    fontFamily: fontFamilies.medium,
                    color: colors.text.secondary,
                  },
                ]}
                numberOfLines={1}
              >
                {petName}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.meta}>
          <Text
            style={[
              styles.dueText,
              {
                fontFamily: fontFamilies.medium,
                color: urgencyColor,
              },
            ]}
          >
            {urgencyText}
          </Text>
          {schedule.seriesCompletedCount > 0 && schedule.totalSeriesDoses && (
            <Text
              style={[
                styles.seriesText,
                {
                  fontFamily: fontFamilies.regular,
                  color: colors.text.subdued,
                },
              ]}
            >
              Dose {schedule.seriesCompletedCount + 1} of{' '}
              {schedule.totalSeriesDoses}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {schedule.status !== 'completed' && schedule.status !== 'skipped' && (
          <>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: urgencyColor }]}
              onPress={handleComplete}
            >
              <MaterialIcon name="check" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.border }]}
              onPress={handleSkip}
            >
              <MaterialIcon
                name="check_circle"
                size={18}
                color={colors.text.secondary}
              />
            </Pressable>
          </>
        )}
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          onPress={handleEdit}
        >
          <MaterialIcon name="edit" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    paddingLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(238, 140, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    lineHeight: 22,
  },
  petName: {
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    marginTop: 6,
    paddingLeft: 52,
  },
  dueText: {
    fontSize: 13,
  },
  seriesText: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
