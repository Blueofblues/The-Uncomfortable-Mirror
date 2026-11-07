import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { getDeviceId } from "@/src/utils/device";
import { api, Profile } from "@/src/utils/api";

const PERSONA_NAME: Record<string, string> = {
  obsidian: "Obsidian", funhouse: "Funhouse", antique: "Antique Vanity",
  brutalist: "Brutalist", vanity: "Rose Vanity",
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      try { const id = await getDeviceId(); setProfile(await api.getProfile(id)); }
      catch { router.replace("/onboarding"); }
    })();
  }, [router]);

  if (!profile) return <View style={[styles.root, styles.center]}><ActivityIndicator color={colors.brand} /></View>;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="profile-back" hitSlop={12} onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>←</Text>
        </Pressable>
        <Text style={styles.title}>The Mirror</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: insets.bottom + spacing.xxxl, gap: spacing.xl }}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Your mirror is</Text>
          <Text style={styles.heroName} testID="mirror-persona">{PERSONA_NAME[profile.mirror_persona] ?? "Obsidian"}</Text>
          <Text style={styles.heroSub} testID="intimacy-level">It knows you as a {profile.intimacy_level}.</Text>
        </View>
        <View style={styles.statsRow}>
          <Stat label="Reflections" value={String(profile.question_count)} />
          <Stat label="Days" value={String(profile.engagement_days)} />
          <Stat label="Shared" value={`${profile.share_level}/5`} />
        </View>
        {profile.reward_tier && profile.reward_tier !== "none" ? (
          <View style={styles.rewardCard} testID="reward-card">
            <Text style={styles.rewardLabel}>Current gift</Text>
            <Text style={styles.rewardValue}>{profile.reward_tier}</Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change the mirror</Text>
          <Text style={styles.cardBody}>The mirror only changes if you do. Share more of yourself and it will see you differently.</Text>
          <Pressable testID="retake-onboarding" onPress={() => router.push("/onboarding")}
            style={({ pressed }) => [styles.primary, pressed && { opacity: 0.75 }]}>
            <Text style={styles.primaryText}>Re-tell the mirror who you are</Text>
          </Pressable>
        </View>
        <Text style={styles.footerNote}>The longer you look in, the more the mirror notices you.</Text>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  iconGlyph: { color: colors.onSurface, fontSize: 18 },
  title: { color: colors.onSurface, fontSize: 18, fontFamily: fonts.display, fontStyle: "italic" },
  hero: { alignItems: "flex-start", gap: spacing.sm, paddingVertical: spacing.xl },
  heroLabel: { color: colors.muted, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: fonts.text },
  heroName: { color: colors.onSurface, fontSize: 48, lineHeight: 56, fontFamily: fonts.display, fontStyle: "italic" },
  heroSub: { color: colors.onSurfaceTertiary, fontSize: 15, fontFamily: fonts.display, fontStyle: "italic" },
  statsRow: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, paddingVertical: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, alignItems: "flex-start", gap: spacing.xs },
  statValue: { color: colors.onSurface, fontSize: 28, fontFamily: fonts.display },
  statLabel: { color: colors.muted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: fonts.text },
  rewardCard: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.warning, backgroundColor: "rgba(51,43,30,0.4)" },
  rewardLabel: { color: colors.onWarning, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontFamily: fonts.text, marginBottom: spacing.xs },
  rewardValue: { color: colors.onSurface, fontSize: 18, fontFamily: fonts.display, fontStyle: "italic", textTransform: "capitalize" },
  card: { padding: spacing.xl, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  cardTitle: { color: colors.onSurface, fontSize: 20, fontFamily: fonts.display, fontStyle: "italic" },
  cardBody: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 22, fontFamily: fonts.text },
  primary: { marginTop: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center" },
  primaryText: { color: colors.onBrandPrimary, fontSize: 13, letterSpacing: 2, fontWeight: "700", textTransform: "uppercase", fontFamily: fonts.text },
  footerNote: { textAlign: "center", color: colors.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.display, fontStyle: "italic", paddingHorizontal: spacing.xl, marginTop: spacing.md },
});
