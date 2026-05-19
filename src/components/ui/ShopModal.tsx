// ─────────────────────────────────────────────
// src/components/ui/ShopModal.tsx
// Shop modal — buy consumables and named variety seeds
// Phase 6: Full variety support — 20 varieties across 4 species
// ─────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  View,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Card } from './Card';
import { SHOP_ITEMS, type ShopItem } from '../../store/inventoryStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

type ShopModalProps = {
  visible: boolean;
  currency: number;
  canAfford: (cost: number) => boolean;
  onBuyItem: (item: ShopItem) => void;
  onBuyWildSeed: (speciesId: string) => void;
  onBuyVarietySeed: (varietyId: string) => void;
  onClose: () => void;
};

function ShopItemRow({
  item,
  canBuy,
  onBuy,
}: {
  item: ShopItem;
  canBuy: boolean;
  onBuy: () => void;
}) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemIcon}>
        <Ionicons name={item.icon as any} size={20} color={COLORS.green_primary} />
      </View>
      <View style={styles.itemInfo}>
        <AppText variant="body" color="primary" numberOfLines={1}>{item.label}</AppText>
        {item.description ? (
          <AppText variant="caption" color="muted" numberOfLines={2}>
            {item.description}
          </AppText>
        ) : null}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.buyBtn,
          canBuy && styles.buyBtnActive,
          pressed && canBuy && styles.buyBtnPressed,
          !canBuy && styles.buyBtnDisabled,
        ]}
        onPress={onBuy}
        disabled={!canBuy}
      >
        <AppText
          variant="label"
          style={{
            color: canBuy ? COLORS.text_accent : COLORS.text_muted,
            fontSize: TYPOGRAPHY.size.xs,
          }}
        >
          {item.cost} ✦
        </AppText>
      </Pressable>
    </View>
  );
}

function RarityBadge({ rarityHint }: { rarityHint?: string }) {
  if (!rarityHint || rarityHint === 'common') return null;
  const variant = rarityHint === 'legendary' ? 'legendary' as const
    : rarityHint === 'rare' ? 'rare' as const
    : 'uncommon' as const;
  return <Badge variant={variant} size="sm" />;
}

export function ShopModal({
  visible, currency, canAfford, onBuyItem, onBuyWildSeed, onBuyVarietySeed, onClose,
}: ShopModalProps) {
  const { consumables, varietiesMap } = useMemo(() => {
    const consumables = SHOP_ITEMS.filter((item) => item.type === 'consumable');
    const varieties = SHOP_ITEMS.filter((item) => item.type === 'variety_seed');
    const varietiesMap: Record<string, ShopItem[]> = {};
    for (const v of varieties) {
      const speciesId = v.varietyId?.split('_')[0] ?? 'unknown';
      if (!varietiesMap[speciesId]) varietiesMap[speciesId] = [];
      varietiesMap[speciesId].push(v);
    }
    return { consumables, varietiesMap };
  }, []);

  const handleBuy = (item: ShopItem) => {
    if (item.type === 'consumable') {
      onBuyItem(item);
    } else if (item.type === 'variety_seed' && item.varietyId) {
      onBuyVarietySeed(item.varietyId);
    }
  };

  const speciesLabels: Record<string, string> = {
    tomato: 'Tomatoes', chili: 'Chilies', basil: 'Basil', radish: 'Radishes',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <AppText variant="heading" color="primary">Shop</AppText>
            <AppText variant="caption" color="muted">
              Spend spores on supplies and cultivar seeds
            </AppText>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </Pressable>
        </View>

        <View style={styles.currencyBar}>
          <Ionicons name="sparkles" size={16} color={COLORS.rarity_legendary} />
          <AppText variant="mono" color="accent" style={styles.currencyAmount}>
            {currency} Spores
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {/* Consumables */}
          <AppText variant="label" color="muted" style={styles.sectionLabel}>
            Consumables
          </AppText>
          <Card variant="default" style={styles.shopCard}>
            {consumables.map((item, i) => (
              <View key={item.id}>
                <ShopItemRow item={item} canBuy={canAfford(item.cost)} onBuy={() => handleBuy(item)} />
                {i < consumables.length - 1 && <View style={styles.itemDivider} />}
              </View>
            ))}
          </Card>

          {/* Varieties by species */}
          {Object.entries(varietiesMap).map(([speciesId, items]) => (
            <View key={speciesId}>
              <AppText variant="label" color="muted" style={styles.sectionLabel}>
                {speciesLabels[speciesId] ?? speciesId}
              </AppText>
              <AppText variant="caption" color="muted" style={styles.sectionNote}>
                Named cultivars with unique trait profiles
              </AppText>
              <Card variant="default" style={styles.shopCard}>
                {items.map((item, i) => (
                  <View key={item.id}>
                    <ShopItemRow
                      item={item}
                      canBuy={canAfford(item.cost)}
                      onBuy={() => handleBuy(item)}
                    />
                    {i < items.length - 1 && <View style={styles.itemDivider} />}
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg_primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING['5'], paddingTop: SPACING['5'], paddingBottom: SPACING['3'],
    borderBottomWidth: 1, borderBottomColor: COLORS.border_subtle, gap: SPACING['3'],
  },
  closeBtn: { padding: SPACING['2'], marginTop: -SPACING['1'] },
  currencyBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING['2'], paddingVertical: SPACING['3'],
    backgroundColor: COLORS.bg_surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border_subtle,
  },
  currencyAmount: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold },
  list: { padding: SPACING['5'], paddingBottom: SPACING['10'] },
  sectionLabel: { marginBottom: SPACING['2'], marginTop: SPACING['4'] },
  sectionNote: { marginBottom: SPACING['2'], lineHeight: 18 },
  shopCard: { gap: 0, padding: 0, overflow: 'hidden' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING['3'],
    paddingHorizontal: SPACING['4'], paddingVertical: SPACING['3'],
  },
  itemIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_deep, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  itemInfo: { flex: 1, gap: 2 },
  buyBtn: {
    paddingHorizontal: SPACING['3'], paddingVertical: SPACING['2'],
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border_subtle, backgroundColor: COLORS.bg_deep,
    minWidth: 56, alignItems: 'center',
  },
  buyBtnActive: { borderColor: COLORS.green_deep, backgroundColor: COLORS.bg_overlay },
  buyBtnPressed: { backgroundColor: COLORS.bg_raised },
  buyBtnDisabled: { opacity: 0.4 },
  itemDivider: { height: 1, backgroundColor: COLORS.border_subtle, marginHorizontal: SPACING['4'] },
});