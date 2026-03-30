import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { HealthRecordsRootNavigation } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useRecordStore } from '../../store/recordStore';
import { icons } from '../../../../shared/assets/icons';

type CategoryFilter = 'Vaccination' | 'Deworming';

const CATEGORIES: CategoryFilter[] = ['Vaccination', 'Deworming'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_PADDING = 32;
const TAB_WIDTH = (SCREEN_WIDTH - TAB_PADDING) / 2;

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('vacc')) {
    return { icon: 'vaccines' as const, tone: '#EA580C', bg: '#FFEDD5' };
  }
  if (lower.includes('deworm')) {
    return { icon: 'healing' as const, tone: '#059669', bg: '#D1FAE5' };
  }
  return { icon: 'pill' as const, tone: '#64748B', bg: '#E2E8F0' };
};

export const HealthRecordsScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors: themeColors } = useTheme();
  const { records, loadRecords } = useRecordStore();

  const [search, setSearch] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const lastOffsetX = useRef(0);

  const goToTab = (index: number) => {
    setCategoryIndex(index);
    Animated.spring(indicatorAnim, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
    }).start();
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const diff = offsetX - lastOffsetX.current;

    if (Math.abs(diff) > SCREEN_WIDTH / 4) {
      if (diff > 0 && categoryIndex < CATEGORIES.length - 1) {
        goToTab(categoryIndex + 1);
      } else if (diff < 0 && categoryIndex > 0) {
        goToTab(categoryIndex - 1);
      }
      lastOffsetX.current = offsetX;
    }
  };

  useEffect(() => {
    loadRecords().catch(() => {});
  }, [loadRecords]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: themeColors.backgroundAlt }]}
    >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleWrap}>
            <Pressable
              style={styles.backBtn}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('HomeTab', { screen: 'Home' });
                }
              }}
            >
              <MaterialIcon
                name="arrow_back"
                size={20}
                color={themeColors.accent}
              />
            </Pressable>
            <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>
              Health Records
            </Text>
          </View>
          <Pressable
            style={[styles.addBtn, { backgroundColor: themeColors.accent }]}
            onPress={() => navigation.navigate('AddHealthRecord')}
          >
            <MaterialIcon
              name="add"
              size={20}
              color={themeColors.text.inverse}
            />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <icons.searchIcon
            width={18}
            height={18}
            color={themeColors.text.subdued}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by vaccine, clinic or vet..."
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, { fontFamily: fontFamilies.regular }]}
          />
        </View>

        <View style={styles.tabWrapper}>
          <View style={styles.tabRow}>
            {CATEGORIES.map((item, index) => {
              const selected = categoryIndex === index;
              return (
                <Pressable
                  key={item}
                  style={[styles.tab, styles.halfTab]}
                  onPress={() => goToTab(index)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        fontFamily: selected
                          ? fontFamilies.bold
                          : fontFamilies.medium,
                        color: selected ? '#EE8C2B' : '#64748B',
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                width: TAB_WIDTH,
                transform: [{ translateX: indicatorAnim }],
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.swipeContainer}
      >
        {CATEGORIES.map(cat => {
          const catRecords = records.filter(record =>
            record.category.toLowerCase().includes(cat.toLowerCase()),
          );
          const catRecent = catRecords.slice(0, 3);
          const catArchive = catRecords.slice(3);

          return (
            <View key={cat} style={styles.swipePage}>
              <ScrollView
                contentContainerStyle={[
                  styles.content,
                  { paddingBottom: tabBarInset + 12 },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {catRecords.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <icons.noRecordsIcon
                        width={180}
                        height={180}
                        color={themeColors.accent}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyTitle,
                        { fontFamily: fontFamilies.bold },
                      ]}
                    >
                      No {cat} Records Yet
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { fontFamily: fontFamilies.medium },
                      ]}
                    >
                      Tap the + button to add your first{' '}
                      {cat === 'Vaccination'
                        ? 'vaccination record'
                        : 'deworming record'}
                    </Text>
                  </View>
                ) : (
                  <View>
                    <View style={styles.sectionRow}>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { fontFamily: fontFamilies.bold },
                        ]}
                      >
                        RECENT RECORDS
                      </Text>
                    </View>
                    <View style={styles.list}>
                      {(catRecent.length > 0 ? catRecent : catRecords).map(
                        (record, index) => {
                          const look = getCategoryIcon(record.category);
                          return (
                            <View
                              key={record.id || `${record.title}-${index}`}
                              style={styles.recordCard}
                            >
                              <View
                                style={[
                                  styles.recordIcon,
                                  { backgroundColor: look.bg },
                                ]}
                              >
                                <MaterialIcon
                                  name={look.icon}
                                  size={20}
                                  color={
                                    look.icon === 'pill'
                                      ? themeColors.text.body
                                      : themeColors.accent
                                  }
                                />
                              </View>
                              <View style={styles.recordBody}>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.recordTitle,
                                    { fontFamily: fontFamilies.bold },
                                  ]}
                                >
                                  {record.title}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.recordMeta,
                                    { fontFamily: fontFamilies.medium },
                                  ]}
                                >
                                  {record.date} • {record.category}
                                </Text>
                              </View>
                              <View style={styles.recordRight}>
                                <MaterialIcon
                                  name={
                                    record.attachments.length
                                      ? 'attach_file'
                                      : 'attach_file_off'
                                  }
                                  size={18}
                                  color={
                                    record.attachments.length
                                      ? themeColors.accent
                                      : themeColors.text.subdued
                                  }
                                />
                                {record.attachments.length > 1 ? (
                                  <Text
                                    style={[
                                      styles.attachCount,
                                      { fontFamily: fontFamilies.bold },
                                    ]}
                                  >
                                    {record.attachments.length}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          );
                        },
                      )}
                    </View>
                  </View>
                )}

                {catArchive.length > 0 ? (
                  <View>
                    <Text
                      style={[
                        styles.sectionLabel,
                        styles.archiveLabel,
                        { fontFamily: fontFamilies.bold },
                      ]}
                    >
                      ARCHIVE
                    </Text>
                    <View style={styles.list}>
                      {catArchive.map((record, index) => (
                        <View
                          key={record.id || `${record.title}-${index}`}
                          style={[styles.recordCard, styles.archiveCard]}
                        >
                          <View style={[styles.recordIcon, styles.archiveIcon]}>
                            <MaterialIcon
                              name="pill"
                              size={20}
                              color={themeColors.text.body}
                            />
                          </View>
                          <View style={styles.recordBody}>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.recordTitle,
                                styles.archiveText,
                                { fontFamily: fontFamilies.bold },
                              ]}
                            >
                              {record.title}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.recordMeta,
                                { fontFamily: fontFamilies.medium },
                              ]}
                            >
                              {record.date}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.premiumCard}>
                  <Text
                    style={[
                      styles.premiumTitle,
                      { fontFamily: fontFamilies.bold },
                    ]}
                  >
                    Upgrade to Premium
                  </Text>
                  <Text
                    style={[
                      styles.premiumBody,
                      { fontFamily: fontFamilies.medium },
                    ]}
                  >
                    Unlimited cloud storage for all your pet&apos;s medical
                    documents and X-rays.
                  </Text>
                  <Pressable style={styles.premiumBtn}>
                    <Text
                      style={[
                        styles.premiumBtnText,
                        { fontFamily: fontFamilies.bold },
                      ]}
                    >
                      Learn More
                    </Text>
                  </Pressable>
                  <View style={styles.premiumIconBg}>
                    <MaterialIcon
                      name="cloud_upload"
                      size={90}
                      color={themeColors.accent}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7F6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#F8F7F6',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(238,140,43,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, lineHeight: 30, color: '#0F172A' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EE8C2B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EE8C2B',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  searchWrap: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: 'rgba(15, 23, 42, 0.4)',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#0F172A',
    padding: 0,
  },
  tabWrapper: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingBottom: 10,
    alignItems: 'center',
  },
  halfTab: {
    flex: 1,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#EE8C2B',
  },
  tabText: { fontSize: 14, lineHeight: 20 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  emptyIconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  swipeContainer: {
    flexDirection: 'row',
  },
  swipePage: {
    width: SCREEN_WIDTH,
  },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 18 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
  },
  archiveLabel: { marginBottom: 10 },
  list: { gap: 10 },
  recordCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  archiveCard: { backgroundColor: 'rgba(255,255,255,0.6)' },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveIcon: { backgroundColor: '#E2E8F0' },
  recordBody: { flex: 1 },
  recordTitle: { color: '#0F172A', fontSize: 16, lineHeight: 22 },
  archiveText: { color: '#475569' },
  recordMeta: { marginTop: 2, color: '#64748B', fontSize: 12, lineHeight: 16 },
  recordRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attachCount: { color: '#EE8C2B', fontSize: 11, lineHeight: 14 },
  premiumCard: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(238,140,43,0.2)',
    backgroundColor: 'rgba(238,140,43,0.08)',
    padding: 18,
    overflow: 'hidden',
  },
  premiumTitle: { color: '#EE8C2B', fontSize: 16, lineHeight: 22 },
  premiumBody: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 210,
  },
  premiumBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#EE8C2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBtnText: { color: '#FFFFFF', fontSize: 12, lineHeight: 16 },
  premiumIconBg: {
    position: 'absolute',
    right: -16,
    bottom: -22,
    opacity: 0.13,
  },
});

export default HealthRecordsScreen;
