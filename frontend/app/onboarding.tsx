import { useMemo, useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  Platform, KeyboardAvoidingView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { getDeviceId } from "@/src/utils/device";
import { api } from "@/src/utils/api";

type Step = {
  key: string; question: string; placeholder?: string;
  options?: string[]; type: "text" | "choice"; skippable: boolean;
};

const STEPS: Step[] = [
  { key: "intro",   question: "This is a mirror.\nIt only reflects what you give it.", type: "text",   placeholder: "What do we call you? (first name, or a lie)", skippable: true },
  { key: "weather", question: "What is the weather inside you tonight?",              type: "choice", options: ["Calm", "Storm", "Fog", "Fire", "Quiet"], skippable: true },
  { key: "heavy",   question: "What are you carrying that you haven't told anyone?",   type: "text",   placeholder: "A sentence. Or silence.", skippable: true },
  { key: "want",    question: "What do you actually want?",                            type: "text",   placeholder: "Short answer. The honest one.", skippable: true },
  { key: "fear",    question: "What are you afraid the mirror will say?",              type: "text",   placeholder: "Say it before I do.", skippable: true },
  { key: "voice",   question: "How honest should I be?",                               type: "choice", options: ["Gentle", "Blunt", "Playful", "Brutal", "Poetic"], skippable: false },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const next = async (value?: string) => {
    const val = (value ?? current).trim();
    const nextAnswers = val ? { ...answers, [step.key]: val } : { ...answers };
    setAnswers(nextAnswers);
    setCurrent("");
    Haptics.selectionAsync().catch(() => {});
    if (!isLast) { setIndex(index + 1); return; }
    try {
      setSubmitting(true);
      const device_id = await getDeviceId();
      const name = nextAnswers.intro || null;
      await api.initProfile({ device_id, name, answers: nextAnswers });
      router.replace("/home");
    } catch (e) { setSubmitting(false); }
  };

  const skip = () => { if (!step.skippable) return; next(""); };
  const progress = useMemo(() => (index + 1) / STEPS.length, [index]);

  return (
    <View style={styles.root}>
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1635151227785-429f420c6b9d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxkYXJrJTIwc21va3klMjBzaWx2ZXIlMjBsaXF1aWQlMjBtZXRhbCUyMHRleHR1cmV8ZW58MHx8fHwxNzkxNzYwODY3fDA&ixlib=rb-4.1.0&q=85" }}
        style={StyleSheet.absoluteFill} contentFit="cover" transition={400}
      />
      <LinearGradient colors={["rgba(5,5,5,0.4)", "rgba(5,5,5,0.95)"]} locations={[0, 0.6]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
          {step.skippable && (
            <Pressable testID="skip-button" onPress={skip} hitSlop={12} style={styles.skipBtn}>
              <Text style={styles.skipText}>skip</Text>
            </Pressable>
          )}
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxxl }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepLabel}>{String(index + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}</Text>
          <Text style={styles.question} testID="onboarding-question">{step.question}</Text>
          {step.type === "text" ? (
            <TextInput testID="onboarding-input" style={styles.input} placeholder={step.placeholder} placeholderTextColor={colors.muted}
              value={current} onChangeText={setCurrent} multiline autoFocus returnKeyType="done" blurOnSubmit />
          ) : (
            <View style={styles.optionsWrap}>
              {step.options?.map((opt) => (
                <Pressable key={opt} testID={`option-${opt.toLowerCase()}`} onPress={() => next(opt)}
                  style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}>
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable testID="onboarding-continue"
            disabled={submitting || (step.type === "text" && !current.trim() && !step.skippable)}
            onPress={() => next()}
            style={({ pressed }) => [styles.primary,
              (submitting || (step.type === "text" && !current.trim() && !step.skippable)) && { opacity: 0.4 },
              pressed && { opacity: 0.7 }]}>
            {submitting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.primaryText}>{isLast ? "Enter the mirror" : "Continue"}</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, gap: spacing.md },
  progressTrack: { flex: 1, height: 2, backgroundColor: colors.border, overflow: "hidden", borderRadius: radius.pill },
  progressFill: { height: "100%", backgroundColor: colors.brandPrimary },
  skipBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  skipText: { color: colors.muted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontFamily: fonts.text },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl },
  stepLabel: { color: colors.muted, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: spacing.xl, fontFamily: fonts.text },
  question: { color: colors.onSurface, fontSize: 32, lineHeight: 42, fontFamily: fonts.display, fontStyle: "italic", marginBottom: spacing.xxl },
  input: { color: colors.onSurface, fontSize: 20, lineHeight: 30, fontFamily: fonts.display, borderBottomWidth: 1, borderBottomColor: colors.borderStrong, paddingVertical: spacing.md, minHeight: 60 },
  optionsWrap: { gap: spacing.sm },
  option: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, alignItems: "center", backgroundColor: "rgba(20,20,20,0.6)" },
  optionText: { color: colors.onSurface, fontSize: 16, fontFamily: fonts.text, letterSpacing: 1 },
  bottomBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  primary: { backgroundColor: colors.brandPrimary, paddingVertical: spacing.lg, borderRadius: radius.pill, alignItems: "center" },
  primaryText: { color: colors.onBrandPrimary, fontSize: 15, fontFamily: fonts.text, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },
});
