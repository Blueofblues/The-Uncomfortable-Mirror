import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mirror.device_id";

function uuid4(): string {
  const rnd = (): number => Math.floor(Math.random() * 0x100000000);
  const b = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    const v = rnd();
    b[i*4] = v & 0xff; b[i*4+1] = (v>>8)&0xff; b[i*4+2] = (v>>16)&0xff; b[i*4+3] = (v>>24)&0xff;
  }
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

async function read(): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

async function write(v: string): Promise<void> {
  if (Platform.OS === "web") { await AsyncStorage.setItem(KEY, v); return; }
  await SecureStore.setItemAsync(KEY, v);
}

export async function getDeviceId(): Promise<string> {
  const existing = await read();
  if (existing) return existing;
  const id = uuid4();
  await write(id);
  return id;
}
