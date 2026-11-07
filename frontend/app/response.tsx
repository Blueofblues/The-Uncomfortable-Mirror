import { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Share, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, radius, fonts } from "@/src/theme";

export default function Response() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    question?: string; answer?: string; follow_up?: string; mode?: string; reward?: string; intimacy?: string;
  }>();
  const question = (params.question as string) || "";
  const answer = (params.answer as string) || "";
  const followUp = (params.follow_up as string) || "";
  const mode = (params.mode as string) || "answer";
  const reward = (params.reward as string) || "";

  const title = useMemo(() => {
    if (mode === "silence") return "The mirror says nothing.";
    if (mode === "reflection") return "A reflection.";
    return "The mirror says";
  }, [mode]);

  const share = async () => {
    const text = `"${answer}"\n\n— The Uncomfortable Mirror`;
    try { await Share.share({ message: text }); } catch {}
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: "https://images.unsplash.com/photo-1635151227785-429f420c6b9d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxkYXJrJTIwc21va3klMjBzaWx2ZXIlMjBsaXF1aWQlMjBtZXRhbCUyMHRleHR1cmV8ZW58MHx8fHwxNzkxNzYwODY3fDA&ixlib=rb-4.1.0&q=85" }}
        style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      <LinearGradient colors={["rgba(5,5,5,0.4)","rgba(5,5,5,0.9)"]} locations={[0, 0.7]} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="back-button" hitSlop={12} onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>←</Text>
        </Pressable>
        <Text style={styles.brandMark}>REFLECTION</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}>
        <Text style={styles.question} testID="response-question">“{question}”</Text>
        <View style={styles.cardWrap}>
          <BlurView intensity={Platform.OS === "ios" ? 50 : 80} tint="dark" style={styles.card} experimentalBlurMethod="dimezisBlurView">
            <View style={styles.cardInner}>
              <Text style={styles.cardLabel}>{title}</Text>
              <Text style={styles.answer} testID="response-answer">{answer}</Text>
              {followUp ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.followUpLabel}>and then it asks</Text>
                  <Text style={styles.followUp} testID="response-followup">{followUp}</Text>
                </>
              ) : null}
            </View>
          </BlurView>
        </View>
        {reward ? (
          <View style={styles.rewardBox} testID="reward-banner">
            <Text style={styles.rewardLabel}>A gift</Text>
            <Text style={styles.rewardText}>{reward}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable testID="again-button" onPress={() => router.replace("/home")}
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.6 }]}>
          <Text style={styles.secondaryText}>Ask again</Text>
        </Pressable>
        <Pressable testID="share-button" onPress={share}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.7 }]}>
          <Text style={styles.primaryText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(20,20,20,0.6)" },
  iconGlyph: { color: colors.onSurface, fontSize: 18 },
  brandMark: { color: colors.muted, fontSize: 11, letterSpacing: 3, fontFamily: fonts.text },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  question: { color: colors.onSurfaceTertiary, fontSize: 16, lineHeight: 24, fontFamily: fonts.display, fontStyle: "italic", marginBottom: spacing.xl },
  cardWrap: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.borderStrong },
  card: { backgroundColor: "rgba(20,20,20,0.6)" },
  cardInner: { padding: spacing.xl, gap: spacing.lg },
  cardLabel: { color: colors.muted, fontSize: 10, letterSpacing: 4, textTransform: "uppercase", fontFamily: fonts.text },
  answer: { color: colors.onSurface, fontSize: 26, lineHeight: 38, fontFamily: fonts.display, fontStyle: "italic" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  followUpLabel: { color: colors.muted, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontFamily: fonts.text },
  followUp: { color: colors.onSurfaceSecondary, fontSize: 18, lineHeight: 28, fontFamily: fonts.display },
  rewardBox: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.warning, backgroundColor: "rgba(51,43,30,0.4)" },
  rewardLabel: { color: colors.onWarning, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontFamily: fonts.text, marginBottom: spacing.xs },
  rewardText: { color: colors.onSurface, fontSize: 15, lineHeight: 22, fontFamily: fonts.display, fontStyle: "italic" },
  footer: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  secondary: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", backgroundColor: "rgba(20,20,20,0.4)" },
  secondaryText: { color: colors.onSurface, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", fontFamily: fonts.text },
  primary: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center" },
  primaryText: { color: colors.onBrandPrimary, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", fontWeight: "700", fontFamily: fonts.text },
});
