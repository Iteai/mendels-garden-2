// ─────────────────────────────────────────────
// app/(tabs)/lab.tsx
// Genetics Lab — full cross-family breeding
// Phase 6: any two seeds can be crossed,
//          including across species families
// ─────────────────────────────────────────────

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell, AppText, Card, Badge, TraitComparison } from '../../src/components/ui';
import { PlantRenderer } from '../../src/components/plants';
import { useSeeds, useInventoryActions, useAppStore } from '../../src/store';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import type { SeedItem } from '../../src/types';
import { previewBreed, type PhenotypePreview } from '../../src/genetics';
import { useGameActions, BREED_COST, isCrossFamily } from '../../src/game';
import { getSpecies } from '../../src/genetics/species';

// ─── Helpers ──────────────────────────────────

function displayName(seed: SeedItem): string {
  try { return getSpecies(seed.speciesId).displayName; }
  catch { return seed.speciesId.replace(/_/g, ' '); }
}

function familyLabel(id: string): string {
  const f = id.split('_')[0];
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function rarityColor(r: SeedItem['rarity']): string {
  return ({ common:COLORS.rarity_common, uncommon:COLORS.rarity_uncommon,
            rare:COLORS.rarity_rare, legendary:COLORS.rarity_legendary } as Record<string,string>)[r] ?? COLORS.text_muted;
}

function formatTrait(key: string): string {
  return key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()).trim();
}

const PREVIEW_TRAITS = ['heightFactor','growthRate','fruitSize','fruitCount','yieldMultiplier','waterEfficiency','primaryColorShift','rarityScore'];

// ─── Seed Picker Modal ────────────────────────

function SeedPickerModal({ visible, title, excludeId, onSelect, onClose }: {
  visible: boolean; title: string; excludeId?: string | null;
  onSelect: (s: SeedItem) => void; onClose: () => void;
}) {
  const seeds = useSeeds();
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    return Object.values(seeds)
      .filter((s) => s.id !== excludeId && s.quantity > 0)
      .filter((s) => !search || displayName(s).toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.phenotype.rarityScore - a.phenotype.rarityScore);
  }, [seeds, excludeId, search]);

  // Group by family for display
  const groups = useMemo(() => {
    const g: Record<string, SeedItem[]> = {};
    list.forEach((s) => {
      const f = s.speciesId.split('_')[0];
      if (!g[f]) g[f] = [];
      g[f].push(s);
    });
    return g;
  }, [list]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={pickerStyles.root}>
        <View style={pickerStyles.header}>
          <AppText variant="heading" color="primary">{title}</AppText>
          <TouchableOpacity onPress={onClose} style={pickerStyles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </TouchableOpacity>
        </View>
        <AppText variant="caption" color="muted" style={pickerStyles.note}>
          All species can be crossed — even across families.
        </AppText>

        {list.length === 0 ? (
          <View style={pickerStyles.empty}>
            <Ionicons name="leaf-outline" size={40} color={COLORS.green_muted} />
            <AppText variant="body" color="muted" style={pickerStyles.emptyText}>No seeds available.</AppText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={pickerStyles.list}>
            {Object.entries(groups).map(([family, seeds]) => (
              <View key={family}>
                <AppText variant="label" color="muted" style={pickerStyles.familyHeader}>
                  {family.toUpperCase()} FAMILY
                </AppText>
                {seeds.map((seed) => (
                  <TouchableOpacity
                    key={seed.id}
                    style={pickerStyles.row}
                    onPress={() => { onSelect(seed); onClose(); }}
                    activeOpacity={0.7}
                  >
                    <View style={[pickerStyles.stripe, { backgroundColor: rarityColor(seed.rarity) }]} />
                    <View style={pickerStyles.preview}>
                      <PlantRenderer speciesId={seed.speciesId} phenotype={seed.phenotype}
                        stage="seed" health={1} width={44} height={44} />
                    </View>
                    <View style={pickerStyles.info}>
                      <View style={pickerStyles.infoTop}>
                        <AppText variant="subheading" color="primary">{displayName(seed)}</AppText>
                        <Badge variant={seed.rarity} size="sm" />
                      </View>
                      <AppText variant="caption" color="muted">
                        Gen {seed.generation} · ×{seed.quantity}
                        {seed.isHybrid ? ' · Hybrid' : ''}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.text_muted} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Parent Slot ──────────────────────────────

function ParentSlot({ label, seed, onPress, onClear }: {
  label: string; seed: SeedItem | null;
  onPress: () => void; onClear?: () => void;
}) {
  return (
    <View style={slotStyles.wrapper}>
      <AppText variant="label" color="muted" style={slotStyles.label}>{label}</AppText>
      <TouchableOpacity
        style={[slotStyles.slot, seed ? slotStyles.filled : slotStyles.empty]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {seed ? (
          <View style={slotStyles.filledContent}>
            <View style={[slotStyles.rarityDot, { backgroundColor: rarityColor(seed.rarity) }]} />
            <PlantRenderer speciesId={seed.speciesId} phenotype={seed.phenotype}
              stage="vegetative" health={1} width={64} height={72} />
            <AppText variant="caption" color="primary" numberOfLines={1}>{displayName(seed)}</AppText>
            <Badge variant={seed.rarity} size="sm" />
          </View>
        ) : (
          <View style={slotStyles.emptyContent}>
            <Ionicons name="add-circle-outline" size={28} color={COLORS.green_muted} />
            <AppText variant="caption" color="muted">Any species</AppText>
          </View>
        )}
      </TouchableOpacity>
      {seed && onClear && (
        <TouchableOpacity style={slotStyles.clearBtn} onPress={onClear} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={18} color={COLORS.text_muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Cross-family banner ──────────────────────

function CrossFamilyBanner({ parentA, parentB }: { parentA: SeedItem; parentB: SeedItem }) {
  const famA = familyLabel(parentA.speciesId);
  const famB = familyLabel(parentB.speciesId);
  return (
    <View style={bannerStyles.container}>
      <Ionicons name="flash" size={14} color={COLORS.rarity_legendary} />
      <AppText variant="label" style={bannerStyles.text}>
        Cross-family hybrid · {famA} × {famB}
      </AppText>
      <AppText variant="caption" style={bannerStyles.sub}>
        Offspring inherit a family randomly · +18% rarity bonus
      </AppText>
    </View>
  );
}

// ─── Trait Preview Bar ────────────────────────

function TraitPreviewBar({ preview }: { preview: PhenotypePreview }) {
  const isColor = preview.trait.includes('ColorShift');
  const range   = isColor ? [-1,1] : preview.trait === 'yieldMultiplier' ? [0,2] : [0,1];
  const span    = range[1] - range[0];
  const norm    = (v: number) => (v - range[0]) / span;
  const minN    = norm(preview.min);
  const meanN   = norm(preview.mean);
  const maxN    = norm(preview.max);
  const barColor = meanN > 0.65 ? COLORS.status_thriving : meanN > 0.40 ? COLORS.status_stressed : COLORS.status_dying;

  return (
    <View style={previewStyles.row}>
      <AppText variant="label" color="muted" style={previewStyles.label}>
        {formatTrait(preview.trait).toUpperCase().slice(0,6)}
      </AppText>
      <View style={previewStyles.track}>
        <View style={[previewStyles.band, { left:`${minN*100}%`, width:`${(maxN-minN)*100}%` }]} />
        <View style={[previewStyles.marker, { left:`${meanN*100}%` }]} />
      </View>
      <AppText variant="mono" style={[previewStyles.val, { color: barColor }]}>
        {isColor
          ? (preview.mean >= 0 ? `+${preview.mean.toFixed(1)}` : preview.mean.toFixed(1))
          : preview.trait === 'yieldMultiplier'
            ? `${preview.mean.toFixed(1)}×`
            : `${Math.round(preview.mean * 100)}%`}
      </AppText>
    </View>
  );
}

// ─── Breed Result Modal ───────────────────────

function BreedResultModal({ visible, seeds, mutations, crossFamily, onClose }: {
  visible: boolean; seeds: SeedItem[]; mutations: number;
  crossFamily: boolean; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={resultStyles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={resultStyles.sheet}>
          <View style={resultStyles.header}>
            <AppText variant="heading" color="accent">
              {crossFamily ? '⚡ Hybrid Offspring' : 'Breeding Complete'}
            </AppText>
            {mutations > 0 && (
              <AppText variant="caption" color="terra">
                {mutations} mutation{mutations > 1 ? 's' : ''} occurred
              </AppText>
            )}
          </View>
          <AppText variant="label" color="muted">{seeds.length} new seeds added</AppText>

          {seeds.map((seed, i) => (
            <View key={seed.id} style={resultStyles.row}>
              <View style={[resultStyles.idx, { borderColor: rarityColor(seed.rarity) }]}>
                <AppText variant="mono" color="muted">{i+1}</AppText>
              </View>
              <PlantRenderer speciesId={seed.speciesId} phenotype={seed.phenotype}
                stage="seed" health={1} width={36} height={36} />
              <View style={resultStyles.info}>
                <View style={resultStyles.infoRow}>
                  <AppText variant="body" color="primary">{displayName(seed)}</AppText>
                  <Badge variant={seed.rarity} />
                </View>
                <AppText variant="caption" color="muted">
                  Gen {seed.generation} · Rarity {Math.round(seed.phenotype.rarityScore*100)}%
                  {seed.isHybrid ? ' · Hybrid' : ''}
                </AppText>
              </View>
            </View>
          ))}

          <TouchableOpacity style={resultStyles.btn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="label" color="accent">Done</AppText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── How it works ─────────────────────────────

function HowItWorks() {
  return (
    <View style={howStyles.container}>
      <AppText variant="label" color="muted" style={howStyles.heading}>How Breeding Works</AppText>
      {[
        { icon:'leaf-outline',      text:'Select any two seeds — same variety, different variety, or even different family' },
        { icon:'git-merge-outline', text:'Each gene is inherited from one parent via Mendelian segregation' },
        { icon:'flash-outline',     text:'Cross-family hybrids get a +18% rarity bonus and surprising trait combinations' },
        { icon:'star-outline',      text:'Rare mutations may flip individual alleles during crossing' },
        { icon:'archive-outline',   text:`3 offspring seeds produced for ${BREED_COST} ✦` },
      ].map((s,i) => (
        <View key={i} style={howStyles.row}>
          <View style={howStyles.icon}><Ionicons name={s.icon as any} size={14} color={COLORS.green_primary} /></View>
          <AppText variant="caption" color="secondary" style={howStyles.text}>{s.text}</AppText>
        </View>
      ))}
    </View>
  );
}

// ─── Compare Modal ───────────────────────────

function CompareModal({ parentA, parentB, visible, onClose }: {
  parentA: SeedItem; parentB: SeedItem;
  visible: boolean; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={compareStyles.root}>
        <View style={compareStyles.header}>
          <AppText variant="heading" color="primary">Seed Comparison</AppText>
          <TouchableOpacity onPress={onClose} style={compareStyles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={compareStyles.content}>
          {/* Parent badges */}
          <View style={compareStyles.badges}>
            <View style={compareStyles.parentBadge}>
              <View style={[compareStyles.badgeDot, { backgroundColor: rarityColor(parentA.rarity) }]} />
              <AppText variant="label" color="primary">A: {displayName(parentA)}</AppText>
              <Badge variant={parentA.rarity} size="sm" />
            </View>
            <AppText variant="label" color="muted" style={compareStyles.vs}>VS</AppText>
            <View style={compareStyles.parentBadge}>
              <View style={[compareStyles.badgeDot, { backgroundColor: rarityColor(parentB.rarity) }]} />
              <AppText variant="label" color="primary">B: {displayName(parentB)}</AppText>
              <Badge variant={parentB.rarity} size="sm" />
            </View>
          </View>

          <AppText variant="caption" color="muted" style={compareStyles.note}>
            Green = stronger parent · Terracotta = weaker · Ranked by higher-is-better traits
          </AppText>

          <Card variant="inset" padded={false}>
            <View style={{ padding: SPACING['4'] }}>
              <TraitComparison parentA={parentA} parentB={parentB} />
            </View>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}

const compareStyles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg_primary },
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:SPACING['5'], paddingTop:SPACING['5'], paddingBottom:SPACING['3'], borderBottomWidth:1, borderBottomColor:COLORS.border_subtle },
  closeBtn:{ padding:SPACING['2'] },
  content: { padding:SPACING['5'], gap:SPACING['4'], paddingBottom:SPACING['10'] },
  badges:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:SPACING['3'], flexWrap:'wrap' },
  parentBadge:{ flexDirection:'row', alignItems:'center', gap:SPACING['2'], backgroundColor:COLORS.bg_surface, borderRadius:RADIUS.md, paddingHorizontal:SPACING['3'], paddingVertical:SPACING['2'], borderWidth:1, borderColor:COLORS.border_subtle },
  badgeDot:{ width:8, height:8, borderRadius:RADIUS.full },
  vs:      { fontSize:12, fontWeight:'700', color:COLORS.text_muted },
  note:    { textAlign:'center', lineHeight:18, maxWidth:300, alignSelf:'center' },
});

// ─── Main Screen ──────────────────────────────

export default function LabScreen() {
  const { breedFromInventory } = useGameActions();
  const [parentA,      setParentA]      = useState<SeedItem | null>(null);
  const [parentB,      setParentB]      = useState<SeedItem | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null);
  const [isBreeding,   setIsBreeding]   = useState(false);
  const [resultSeeds,  setResultSeeds]  = useState<SeedItem[]>([]);
  const [resultMuts,   setResultMuts]   = useState(0);
  const [showResult,   setShowResult]   = useState(false);
  const [showCompare,  setShowCompare]  = useState(false);

  const crossFam = !!(parentA && parentB && isCrossFamily(parentA, parentB));
  const canBreed = !!(parentA && parentB);

  const preview = useMemo<PhenotypePreview[]>(() => {
    if (!parentA || !parentB) return [];
    return previewBreed(parentA, parentB, 20).filter((p) => PREVIEW_TRAITS.includes(p.trait));
  }, [parentA, parentB]);

  const handleBreed = useCallback(() => {
    if (!parentA || !parentB) return;
    setIsBreeding(true);
    setTimeout(() => {
      const result = breedFromInventory(parentA.id, parentB.id);
      if (!result.ok) { setIsBreeding(false); return; }
      const addedSeeds = useAppStore.getState().seeds;
      const offspring  = result.seedIds.map((id) => addedSeeds[id]).filter(Boolean) as SeedItem[];
      setResultSeeds(offspring);
      setResultMuts(result.mutationEvents);
      setShowResult(true);
      setIsBreeding(false);
    }, 300);
  }, [parentA, parentB, breedFromInventory]);

  return (
    <ScreenShell title="Lab" subtitle="Genetics workbench">

      {/* Parents */}
      <Card variant="raised" style={styles.section}>
        <AppText variant="label" color="muted" style={styles.sectionLabel}>Breeding Station</AppText>

        <View style={styles.parents}>
          <ParentSlot label="Parent A" seed={parentA}
            onPress={() => setPickerTarget('A')} onClear={() => setParentA(null)} />
          <View style={styles.crossIcon}>
            <AppText style={[styles.crossGlyph, crossFam && { color: COLORS.rarity_legendary }]}>×</AppText>
          </View>
          <ParentSlot label="Parent B" seed={parentB}
            onPress={() => setPickerTarget('B')} onClear={() => setParentB(null)} />
        </View>

        {crossFam && parentA && parentB && (
          <CrossFamilyBanner parentA={parentA} parentB={parentB} />
        )}

        <TouchableOpacity
          style={[
            styles.breedBtn,
            canBreed && styles.breedBtnActive,
            crossFam && styles.breedBtnHybrid,
          ]}
          onPress={handleBreed}
          disabled={!canBreed || isBreeding}
          activeOpacity={0.7}
        >
          <Ionicons name="git-merge-outline" size={18}
            color={canBreed ? (crossFam ? COLORS.rarity_legendary : COLORS.text_accent) : COLORS.text_muted} />
          <AppText variant="label" style={{
            color: canBreed ? (crossFam ? COLORS.rarity_legendary : COLORS.text_accent) : COLORS.text_muted,
          }}>
            {isBreeding ? 'Breeding…' : canBreed
              ? `${crossFam ? '⚡ Hybrid Breed' : 'Breed'} · 3 offspring · ${BREED_COST} ✦`
              : 'Select two parent seeds'}
          </AppText>
        </TouchableOpacity>

        {/* Phase 7: Compare button */}
        {canBreed && (
          <TouchableOpacity
            style={styles.compareBtn}
            onPress={() => setShowCompare(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="git-compare-outline" size={16} color={COLORS.rarity_rare} />
            <AppText variant="caption" style={{ color: COLORS.rarity_rare }}>
              Compare Parents
            </AppText>
          </TouchableOpacity>
        )}
      </Card>

      {/* Trait preview */}
      {preview.length > 0 && (
        <Card variant="inset" style={styles.section}>
          <AppText variant="label" color="muted" style={styles.sectionLabel}>Offspring Trait Preview</AppText>
          <AppText variant="caption" color="muted" style={styles.previewNote}>
            20 simulated crosses · band = range · marker = mean
            {crossFam ? ' · preview uses Parent A species' : ''}
          </AppText>
          {preview.map((p) => <TraitPreviewBar key={p.trait} preview={p} />)}
        </Card>
      )}

      {!parentA && !parentB && <HowItWorks />}

      <SeedPickerModal visible={pickerTarget === 'A'} title="Select Parent A"
        excludeId={parentB?.id} onSelect={setParentA} onClose={() => setPickerTarget(null)} />
      <SeedPickerModal visible={pickerTarget === 'B'} title="Select Parent B"
        excludeId={parentA?.id} onSelect={setParentB} onClose={() => setPickerTarget(null)} />
      <BreedResultModal visible={showResult} seeds={resultSeeds} mutations={resultMuts}
        crossFamily={crossFam}
        onClose={() => { setShowResult(false); setParentA(null); setParentB(null); }} />
      {parentA && parentB && (
        <CompareModal parentA={parentA} parentB={parentB}
          visible={showCompare} onClose={() => setShowCompare(false)} />
      )}
    </ScreenShell>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  section:      { marginBottom: SPACING['4'] },
  sectionLabel: { marginBottom: SPACING['3'] },
  compareBtn:   { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:SPACING['2'], paddingVertical:SPACING['2'], marginTop:SPACING['2'], borderRadius:RADIUS.md, borderWidth:1, borderColor:COLORS.border_subtle, backgroundColor:COLORS.bg_deep },
  parents:      { flexDirection:'row', alignItems:'flex-start', gap:SPACING['2'], marginBottom:SPACING['3'] },
  crossIcon:    { marginTop: SPACING['8'], alignItems:'center', width:28 },
  crossGlyph:   { fontSize:18, color:COLORS.text_muted, fontWeight:TYPOGRAPHY.weight.bold },
  breedBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:SPACING['2'], paddingVertical:SPACING['3'], borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.border_subtle, backgroundColor:COLORS.bg_deep, opacity:0.55 },
  breedBtnActive:{ opacity:1, borderColor:COLORS.green_deep, backgroundColor:COLORS.bg_overlay },
  breedBtnHybrid:{ borderColor:COLORS.rarity_legendary, backgroundColor:'rgba(196,154,26,0.08)' },
  previewNote:  { marginBottom:SPACING['3'], lineHeight:18 },
});

const slotStyles = StyleSheet.create({
  wrapper:      { flex:1, position:'relative' },
  label:        { textAlign:'center', marginBottom:SPACING['2'] },
  slot:         { borderRadius:RADIUS.lg, borderWidth:1, minHeight:130, alignItems:'center', justifyContent:'center', padding:SPACING['2'] },
  empty:        { backgroundColor:COLORS.bg_deep, borderColor:COLORS.border_subtle, borderStyle:'dashed' },
  filled:       { backgroundColor:COLORS.bg_surface, borderColor:COLORS.green_deep },
  emptyContent: { alignItems:'center', gap:SPACING['2'] },
  filledContent:{ alignItems:'center', gap:SPACING['1'] },
  rarityDot:    { position:'absolute', top:-4, right:-4, width:8, height:8, borderRadius:RADIUS.full },
  clearBtn:     { position:'absolute', top:24, right:-8, zIndex:10 },
});

const bannerStyles = StyleSheet.create({
  container: { flexDirection:'column', gap:2, backgroundColor:'rgba(196,154,26,0.10)', borderRadius:RADIUS.md, borderWidth:1, borderColor:COLORS.rarity_legendary, padding:SPACING['2'], marginBottom:SPACING['3'] },
  text:      { color:COLORS.rarity_legendary, letterSpacing:0.8 },
  sub:       { color:COLORS.text_muted, fontSize:10, marginTop:1 },
});

const previewStyles = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap:SPACING['2'], marginBottom:SPACING['2'] },
  label:  { width:44, fontSize:9 },
  track:  { flex:1, height:6, backgroundColor:COLORS.bg_overlay, borderRadius:RADIUS.full, overflow:'visible', position:'relative' },
  band:   { position:'absolute', height:'100%', backgroundColor:COLORS.green_deep, borderRadius:RADIUS.full, opacity:0.7 },
  marker: { position:'absolute', width:3, height:10, top:-2, backgroundColor:COLORS.green_bright, borderRadius:RADIUS.full, marginLeft:-1.5 },
  val:    { width:40, textAlign:'right', fontSize:TYPOGRAPHY.size.xs },
});

const pickerStyles = StyleSheet.create({
  root:        { flex:1, backgroundColor:COLORS.bg_primary },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:SPACING['5'], paddingTop:SPACING['5'], paddingBottom:SPACING['3'], borderBottomWidth:1, borderBottomColor:COLORS.border_subtle },
  closeBtn:    { padding:SPACING['2'] },
  note:        { paddingHorizontal:SPACING['5'], paddingTop:SPACING['2'], paddingBottom:SPACING['1'] },
  list:        { padding:SPACING['5'], gap:SPACING['2'] },
  empty:       { flex:1, alignItems:'center', justifyContent:'center', gap:SPACING['4'], padding:SPACING['8'] },
  emptyText:   { textAlign:'center' },
  familyHeader:{ marginTop:SPACING['3'], marginBottom:SPACING['2'] },
  row:         { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.bg_surface, borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.border_subtle, overflow:'hidden', paddingRight:SPACING['3'], marginBottom:SPACING['2'] },
  rowPressed:  { backgroundColor:COLORS.bg_raised },
  stripe:      { width:4, alignSelf:'stretch', opacity:0.8 },
  preview:     { width:44, height:44, backgroundColor:COLORS.bg_deep, alignItems:'center', justifyContent:'flex-end', marginHorizontal:SPACING['2'], borderRadius:RADIUS.sm, overflow:'hidden', flexShrink:0 },
  info:        { flex:1, gap:SPACING['1'], paddingVertical:SPACING['2'] },
  infoTop:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
});

const resultStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.72)', justifyContent:'flex-end' },
  sheet:   { backgroundColor:COLORS.bg_surface, borderTopLeftRadius:RADIUS['2xl'], borderTopRightRadius:RADIUS['2xl'], borderTopWidth:1, borderColor:COLORS.green_deep, padding:SPACING['6'], gap:SPACING['3'] },
  header:  { gap:SPACING['1'] },
  row:     { flexDirection:'row', alignItems:'center', gap:SPACING['3'], backgroundColor:COLORS.bg_raised, borderRadius:RADIUS.md, padding:SPACING['3'], borderWidth:1, borderColor:COLORS.border_subtle },
  idx:     { width:28, height:28, borderRadius:RADIUS.full, borderWidth:1, alignItems:'center', justifyContent:'center', backgroundColor:COLORS.bg_deep, flexShrink:0 },
  info:    { flex:1, gap:SPACING['1'] },
  infoRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  btn:     { alignItems:'center', paddingVertical:SPACING['3'], borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.green_deep, backgroundColor:COLORS.bg_overlay },
});

const howStyles = StyleSheet.create({
  container: { gap:SPACING['3'] },
  heading:   { marginBottom:SPACING['2'] },
  row:       { flexDirection:'row', alignItems:'flex-start', gap:SPACING['3'] },
  icon:      { width:26, height:26, borderRadius:RADIUS.sm, backgroundColor:COLORS.bg_surface, borderWidth:1, borderColor:COLORS.border_subtle, alignItems:'center', justifyContent:'center', flexShrink:0 },
  text:      { flex:1, lineHeight:20, paddingTop:SPACING['1'] },
});