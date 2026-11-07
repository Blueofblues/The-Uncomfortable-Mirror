import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { getDeviceId } from "@/src/utils/device";
import { api } from "@/src/utils/api";
import { colors } from "@/src/theme";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await getDeviceId();
      try {
        await api.getProfile(id);
        if (!cancelled) router.replace("/home");
      } catch {
        if (!cancelled) router.replace("/onboarding");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <View style={styles.container} testID="boot-screen">
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
