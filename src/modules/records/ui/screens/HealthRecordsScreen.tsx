import React, { useEffect, useMemo, useState } from 'react';
import {
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

type CategoryFilter = 'All' | 'Vaccinations' | 'Checkups' | 'Surgery';

const CATEGORIES: CategoryFilter[] = ['All', 'Vaccinations', 'Checkups', 'Surgery'];

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('vacc')) {
    return { icon: 'vaccines' as const, tone: '#EA580C', bg: '#FFEDD5' };
  }
  if (lower.includes('check') || lower.includes('exam')) {
    return { icon: 'stethoscope' as const, tone: '#2563EB', bg: '#DBEAFE' };
  }
  if (lower.includes('surgery')) {
    return { icon: 'medical_services' as const, tone: '#7C3AED', bg: '#EDE9FE' };
  }
  return { icon: 'pill' as const, tone: '#64748B', bg: '#E2E8F0' };
};

export const HealthRecordsScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors } = useTheme();
  const { records, loadRecords } = useRecordStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');

  useEffect(() => {
    loadRecords().catch(() => {});
  }, [loadRecords]);

  const filteredRecords = useMemo(
    () =>
      records.filter(record => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          record.title.toLowerCase().includes(query) ||
          record.category.toLowerCase().includes(query) ||
          record.notes.toLowerCase().includes(query);

        if (!matchesSearch) {
          return false;
        }
        if (category === 'All') {
          return true;
        }
        return record.category.toLowerCase().includes(category.toLowerCase().slice(0, -1));
      }),
    [records, search, category],
  );

  const recent = filteredRecords.slice(0, 3);
  const archive = filteredRecords.slice(3);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
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
              <MaterialIcon name="arrow_back" size={20} color={colors.accent} />
            </Pressable>
            <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>Health Records</Text>
          </View>
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('AddHealthRecord')}
          >
            <MaterialIcon name="add" size={20} color={colors.text.inverse} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcon name="search" size={18} color={colors.text.subdued} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by vaccine, clinic or vet..."
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, { fontFamily: fontFamilies.regular }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {CATEGORIES.map(item => {
            const selected = category === item;
            return (
              <Pressable key={item} style={[styles.tab, selected && styles.tabActive]} onPress={() => setCategory(item)}>
                <Text style={[styles.tabText, selected && styles.tabTextActive, { fontFamily: selected ? fontFamilies.bold : fontFamilies.medium }]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { fontFamily: fontFamilies.bold }]}>RECENT RECORDS</Text>
          </View>
          <View style={styles.list}>
            {(recent.length > 0 ? recent : filteredRecords).map((record, index) => {
              const look = getCategoryIcon(record.category);
              return (
                <View key={record.id || `${record.title}-${index}`} style={styles.recordCard}>
                  <View style={[styles.recordIcon, { backgroundColor: look.bg }]}>
                    <MaterialIcon
                      name={look.icon}
                      size={20}
                      color={look.icon === 'pill' ? colors.text.body : colors.accent}
                    />
                  </View>
                  <View style={styles.recordBody}>
                    <Text numberOfLines={1} style={[styles.recordTitle, { fontFamily: fontFamilies.bold }]}>{record.title}</Text>
                    <Text numberOfLines={1} style={[styles.recordMeta, { fontFamily: fontFamilies.medium }]}>
                      {record.date} • {record.category}
                    </Text>
                  </View>
                  <View style={styles.recordRight}>
                    <MaterialIcon
                      name={record.attachments.length ? 'attach_file' : 'attach_file_off'}
                      size={18}
                      color={record.attachments.length ? colors.accent : colors.text.subdued}
                    />
                    {record.attachments.length > 1 ? (
                      <Text style={[styles.attachCount, { fontFamily: fontFamilies.bold }]}>{record.attachments.length}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {archive.length > 0 ? (
          <View>
            <Text style={[styles.sectionLabel, styles.archiveLabel, { fontFamily: fontFamilies.bold }]}>ARCHIVE</Text>
            <View style={styles.list}>
              {archive.map((record, index) => (
                <View key={record.id || `${record.title}-${index}`} style={[styles.recordCard, styles.archiveCard]}>
                  <View style={[styles.recordIcon, styles.archiveIcon]}>
                    <MaterialIcon name="pill" size={20} color={colors.text.body} />
                  </View>
                  <View style={styles.recordBody}>
                    <Text numberOfLines={1} style={[styles.recordTitle, styles.archiveText, { fontFamily: fontFamilies.bold }]}>{record.title}</Text>
                    <Text numberOfLines={1} style={[styles.recordMeta, { fontFamily: fontFamilies.medium }]}>{record.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.premiumCard}>
          <Text style={[styles.premiumTitle, { fontFamily: fontFamilies.bold }]}>Upgrade to Premium</Text>
          <Text style={[styles.premiumBody, { fontFamily: fontFamilies.medium }]}>
            Unlimited cloud storage for all your pet&apos;s medical documents and X-rays.
          </Text>
          <Pressable style={styles.premiumBtn}>
            <Text style={[styles.premiumBtnText, { fontFamily: fontFamilies.bold }]}>Learn More</Text>
          </Pressable>
          <View style={styles.premiumIconBg}>
            <MaterialIcon name="cloud_upload" size={90} color={colors.accent} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7F6' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: '#F8F7F6' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(238,140,43,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, lineHeight: 30, color: '#0F172A' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EE8C2B', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { height: 50, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, lineHeight: 20, color: '#0F172A', padding: 0 },
  tabsRow: { gap: 16, marginTop: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#EE8C2B' },
  tabText: { color: '#64748B', fontSize: 14, lineHeight: 20 },
  tabTextActive: { color: '#EE8C2B' },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 18 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { color: '#94A3B8', fontSize: 11, lineHeight: 14, letterSpacing: 1.2 },
  archiveLabel: { marginBottom: 10 },
  list: { gap: 10 },
  recordCard: { borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  archiveCard: { backgroundColor: 'rgba(255,255,255,0.6)' },
  recordIcon: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  archiveIcon: { backgroundColor: '#E2E8F0' },
  recordBody: { flex: 1 },
  recordTitle: { color: '#0F172A', fontSize: 16, lineHeight: 22 },
  archiveText: { color: '#475569' },
  recordMeta: { marginTop: 2, color: '#64748B', fontSize: 12, lineHeight: 16 },
  recordRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attachCount: { color: '#EE8C2B', fontSize: 11, lineHeight: 14 },
  premiumCard: { marginTop: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(238,140,43,0.2)', backgroundColor: 'rgba(238,140,43,0.08)', padding: 18, overflow: 'hidden' },
  premiumTitle: { color: '#EE8C2B', fontSize: 16, lineHeight: 22 },
  premiumBody: { marginTop: 4, color: '#64748B', fontSize: 12, lineHeight: 18, maxWidth: 210 },
  premiumBtn: { marginTop: 12, alignSelf: 'flex-start', height: 32, borderRadius: 8, paddingHorizontal: 14, backgroundColor: '#EE8C2B', alignItems: 'center', justifyContent: 'center' },
  premiumBtnText: { color: '#FFFFFF', fontSize: 12, lineHeight: 16 },
  premiumIconBg: { position: 'absolute', right: -16, bottom: -22, opacity: 0.13 },
});

export default HealthRecordsScreen;
