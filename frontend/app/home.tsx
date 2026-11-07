import { useEffect, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Platform, KeyboardAvoidingView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { getDeviceId } from "@/src/utils/device";
import { api, Profile } from "@/src/utils/api";

const INTIMACY_LABEL: Record<string, string> = {
  stranger: "stranger", acquaintance: "acquaintance", confidant: "confidant", mirror: "mirror",
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setDeviceId(id);
      try { setProfile(await api.getProfile(id)); }
      catch { router.replace("/onboarding"); }
    })();
  }, [router]);

  const ask = async () => {
    const q = question.trim();
    if (!q || !deviceId || loading) return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const res = await api.ask({ device_id: deviceId, question: q });
      setQuestion(""); setLoading(false);
      router.push({
        pathname: "/response",
        params: {
          id: res.id, question: q, answer: res.answer,
          follow_up: res.follow_up || "", mode: res.mode,
          reward: res.reward || "", intimacy: res.intimacy_level,
        },
      });
    } catch { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1710438399422-2fca27686bcd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBvYnNpZGlhbiUyMGdsYXNzJTIwcmVmbGVjdGlvbnxlbnwwfHx8fDE3OTE3NjA4Njd8MA&ixlib=rb-4.1.0&q=85" }}
        style={StyleSheet.absoluteFill} contentFit="cover" transition={500} />
      <LinearGradient colors={["rgba(5,5,5,0.75)","rgba(5,5,5,0.95)","rgba(5,5,5,1)"]} locations={[0,0.5,1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={styles.brandMark}>THE UNCOMFORTABLE MIRROR</Text>
          {profile && (
            <Text style={styles.intimacy} testID="intimacy-badge">
              {profile.name ? `${profile.name} · ` : ""}{INTIMACY_LABEL[profile.intimacy_level] ?? profile.intimacy_level}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable testID="history-button" hitSlop={10} style={styles.iconBtn} onPress={() => router.push("/history")}>
            <Text style={styles.iconGlyph}>⌯</Text>
          </Pressable>
          <Pressable testID="profile-button" hitSlop={10} style={styles.iconBtn} onPress={() => router.push("/profile")}>
            <Text style={styles.iconGlyph}>◉</Text>
          </Pressable>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.center}>
        <View style={styles.inputWrap}>
          <Text style={styles.prompt}>What is troubling you?</Text>
          <TextInput testID="mirror-input" style={styles.input} placeholder="Ask the mirror…" placeholderTextColor={colors.muted}
            value={question} onChangeText={setQuestion} multiline maxLength={400} />
        </View>
      </KeyboardAvoidingView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Pressable testID="ask-button" disabled={!question.trim() || loading} onPress={ask}
          style={({ pressed }) => [styles.fab, (!question.trim() || loading) && { opacity: 0.35 }, pressed && { transform: [{ scale: 0.97 }] }]}>
          {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.fabText}>Reflect</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  brandMark: { color: colors.onSurface, fontSize: 11, letterSpacing: 3, fontFamily: fonts.text, fontWeight: "600" },
  intimacy: { color: colors.muted, fontSize: 11, letterSpacing: 2, marginTop: 4, fontFamily: fonts.text, textTransform: "lowercase", fontStyle: "italic" },
  headerActions: { flexDirection: "row", gap: spacing.md },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(20,20,20,0.5)" },
  iconGlyph: { color: colors.onSurface, fontSize: 16 },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  inputWrap: { gap: spacing.xl },
  prompt: { color: colors.muted, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", fontFamily: fonts.text },
  input: { color: colors.onSurface, fontSize: 32, lineHeight: 44, fontFamily: fonts.display, fontStyle: "italic", minHeight: 140, textAlignVertical: "top" },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, alignItems: "flex-end" },
  fab: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", minWidth: 160 },
  fabText: { color: colors.onBrandPrimary, fontSize: 14, letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", fontFamily: fonts.text },
});
