import { useState, useCallback } from "react";
import {
  View, Text, Pressable, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { getDeviceId } from "@/src/utils/device";
import { api, Reflection } from "@/src/utils/api";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const id = await getDeviceId();
      setItems(await api.history(id));
    } catch { setItems([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="history-back" hitSlop={12} onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>←</Text>
        </Pressable>
        <Text style={styles.title}>Past Reflections</Text>
        <View style={{ width: 36 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1767044202331-c3a0a7cbdf43?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxicm9rZW4lMjBtaXJyb3IlMjBzaGFyZHMlMjBvbiUyMGJsYWNrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3OTE3NjA4Njd8MA&ixlib=rb-4.1.0&q=85" }}
            style={styles.emptyImage} contentFit="cover" />
          <Text style={styles.emptyTitle}>No reflections yet.</Text>
          <Text style={styles.emptySub}>Ask the mirror something.</Text>
        </View>
      ) : (
        <FlatList
          data={items} keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xxxl, paddingTop: spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          renderItem={({ item }) => (
            <Pressable testID={`history-item-${item.id}`}
              onPress={() => router.push({ pathname: "/response", params: { id: item.id, question: item.question, answer: item.answer, follow_up: item.follow_up || "", mode: item.mode } })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <View style={styles.rowMetaRow}>
                <Text style={styles.rowDate}>{formatDate(item.created_at)}</Text>
                <Text style={styles.rowMode}>{item.mode}</Text>
              </View>
              <Text style={styles.rowQuestion} numberOfLines={2}>{item.question}</Text>
              <Text style={styles.rowAnswer} numberOfLines={3}>{item.answer}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  iconGlyph: { color: colors.onSurface, fontSize: 18 },
  title: { color: colors.onSurface, fontSize: 18, fontFamily: fonts.display, fontStyle: "italic" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyImage: { width: 160, height: 160, borderRadius: radius.lg, marginBottom: spacing.xl, opacity: 0.75 },
  emptyTitle: { color: colors.onSurface, fontSize: 20, fontFamily: fonts.display, fontStyle: "italic", marginBottom: spacing.sm },
  emptySub: { color: colors.muted, fontSize: 13, fontFamily: fonts.text, letterSpacing: 1 },
  row: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, gap: spacing.sm },
  rowMetaRow: { flexDirection: "row", justifyContent: "space-between" },
  rowDate: { color: colors.muted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: fonts.text },
  rowMode: { color: colors.onSurfaceTertiary, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: fonts.text },
  rowQuestion: { color: colors.onSurface, fontSize: 16, fontFamily: fonts.display, fontStyle: "italic", lineHeight: 22 },
  rowAnswer: { color: colors.onSurfaceSecondary, fontSize: 13, fontFamily: fonts.text, lineHeight: 20 },
});
