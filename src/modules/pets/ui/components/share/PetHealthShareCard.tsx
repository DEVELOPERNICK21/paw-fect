import React from 'react';
import { Image, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import type {
  PetHealthCardItem,
  PetHealthCardItemStatus,
  PetHealthCardViewModel,
} from '../../../domain/models/PetHealthCardViewModel';
import {
  petHealthShareCardStyles,
  shareCardPalette,
} from './PetHealthShareCard.styles';

export interface PetHealthShareCardProps {
  viewModel: PetHealthCardViewModel;
}

export const PetHealthShareCard: React.FC<PetHealthShareCardProps> = ({
  viewModel,
}) => {
  const { fontFamilies } = useTheme();
  const { pet, snapshot, footer } = viewModel;
  const subline = formatSubline(pet.breedLabel, pet.ageLabel);

  return (
    <View style={petHealthShareCardStyles.root} collapsable={false}>
      <View style={petHealthShareCardStyles.hero}>
        <View style={petHealthShareCardStyles.avatarRing}>
          <Image
            source={pet.photoSource}
            style={petHealthShareCardStyles.avatarImage}
            resizeMode="cover"
          />
        </View>
        <Text
          style={[
            petHealthShareCardStyles.petName,
            { fontFamily: fontFamilies.extrabold },
          ]}
          numberOfLines={2}
        >
          {pet.name}
        </Text>
        {subline ? (
          <Text
            style={[
              petHealthShareCardStyles.petSubline,
              { fontFamily: fontFamilies.medium },
            ]}
            numberOfLines={2}
          >
            {subline}
          </Text>
        ) : null}
      </View>

      <View style={petHealthShareCardStyles.body}>
        {snapshot.kind === 'items' ? (
          <>
            <Text
              style={[
                petHealthShareCardStyles.sectionLabel,
                { fontFamily: fontFamilies.bold },
              ]}
            >
              HEALTH SNAPSHOT
            </Text>
            {snapshot.items.map((item, index) => (
              <SnapshotRow
                key={`${item.label}-${index}`}
                item={item}
                fontFamilies={fontFamilies}
                isLast={index === snapshot.items.length - 1}
              />
            ))}
          </>
        ) : (
          <View style={petHealthShareCardStyles.emptyWrap}>
            <Text style={petHealthShareCardStyles.emptyEmoji}>
              {snapshot.speciesEmoji}
            </Text>
            <Text
              style={[
                petHealthShareCardStyles.emptyTitle,
                { fontFamily: fontFamilies.bold },
              ]}
            >
              Just added {pet.name} to Pawsoul 🎉
            </Text>
            <Text
              style={[
                petHealthShareCardStyles.emptySub,
                { fontFamily: fontFamilies.medium },
              ]}
            >
              Vaccines and deworming auto-scheduled below.
            </Text>
          </View>
        )}
      </View>

      <View style={petHealthShareCardStyles.footer}>
        <Text
          style={[
            petHealthShareCardStyles.footerUrl,
            { fontFamily: fontFamilies.medium },
          ]}
          numberOfLines={1}
        >
          {footer.urlLabel}
        </Text>
        <Text
          style={[
            petHealthShareCardStyles.footerBrand,
            { fontFamily: fontFamilies.bold },
          ]}
          numberOfLines={1}
        >
          {footer.brandLabel}
        </Text>
      </View>
    </View>
  );
};

PetHealthShareCard.displayName = 'PetHealthShareCard';

const SnapshotRow: React.FC<{
  item: PetHealthCardItem;
  fontFamilies: {
    medium: string;
    bold: string;
  };
  isLast: boolean;
}> = ({ item, fontFamilies, isLast }) => {
  const palette = chipPalette(item.status);
  return (
    <View
      style={[
        petHealthShareCardStyles.row,
        isLast ? petHealthShareCardStyles.rowLast : null,
      ]}
    >
      <Text
        style={[
          petHealthShareCardStyles.rowLabel,
          { fontFamily: fontFamilies.medium },
        ]}
        numberOfLines={2}
      >
        {item.label}
      </Text>
      <View style={[petHealthShareCardStyles.chip, { backgroundColor: palette.bg }]}>
        <Text
          style={[
            petHealthShareCardStyles.chipText,
            { color: palette.fg, fontFamily: fontFamilies.bold },
          ]}
        >
          {item.detail}
        </Text>
      </View>
    </View>
  );
};

function chipPalette(status: PetHealthCardItemStatus): {
  bg: string;
  fg: string;
} {
  switch (status) {
    case 'done':
      return {
        bg: shareCardPalette.CHIP_DONE_BG,
        fg: shareCardPalette.CHIP_DONE_FG,
      };
    case 'due_in':
      return {
        bg: shareCardPalette.CHIP_DUE_BG,
        fg: shareCardPalette.CHIP_DUE_FG,
      };
    case 'overdue':
      return {
        bg: shareCardPalette.CHIP_OVERDUE_BG,
        fg: shareCardPalette.CHIP_OVERDUE_FG,
      };
  }
}

function formatSubline(breed: string | null, age: string | null): string | null {
  if (breed && age) {
    return `${breed} · ${age}`;
  }
  return breed ?? age ?? null;
}
