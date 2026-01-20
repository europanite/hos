import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { REPO_URL, REPO_URL_PAGE } from "./HomeScreenUtil";

type Role = "system" | "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  text: string;
  ts: number;
};

function mkId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowTs() {
  return Date.now();
}

function safeJsonStringify(obj: unknown) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function extractReply(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  const candidates = ["reply", "message", "text", "output", "content", "answer"];
  for (const k of candidates) {
    const v = p[k];
    if (typeof v === "string" && v.trim()) return v;
  }

  const data = p["data"];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const k of candidates) {
      const v = d[k];
      if (typeof v === "string" && v.trim()) return v;
    }
  }

  return null;
}

const CONTENT_MAX_W = 820;
const BG = "#0b0f16";
const CARD = "#121a27";
const BORDER = "#22304a";
const TXT = "#e6ecff";
const SUB = "#a8b3cf";
const ACCENT = "#7aa2ff";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;

  const API_BASE: string = (process.env.EXPO_PUBLIC_API_BASE ?? "").trim();

  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");

  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      id: mkId(),
      role: "system",
      text:
        "HOS_BABEL is ready.\n" +
        (API_BASE
          ? `API base detected: ${API_BASE}`
          : "API base is empty. Set EXPO_PUBLIC_API_BASE to enable server replies."),
      ts: nowTs(),
    },
  ]);

  const headerText = useMemo(() => {
    if (!API_BASE) return "Offline mode";
    if (apiStatus === "ok") return "API connected";
    if (apiStatus === "error") return "API unreachable";
    return "Checking API…";
  }, [API_BASE, apiStatus]);

  const scrollToBottom = useCallback((animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      if (!API_BASE) {
        setApiStatus("unknown");
        return;
      }
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);

        const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
        clearTimeout(t);

        if (cancelled) return;
        setApiStatus(res ? "ok" : "error");
      } catch {
        if (cancelled) return;
        setApiStatus("error");
      }
    }

    ping();
    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  useEffect(() => {
    scrollToBottom(false);
  }, [msgs.length, scrollToBottom]);

  const appendMsg = useCallback((role: Role, text: string) => {
    setMsgs((prev) => prev.concat([{ id: mkId(), role, text, ts: nowTs() }]));
  }, []);

  const sendToServer = useCallback(
    async (userText: string) => {
      if (!API_BASE) return null;

      const endpoints = ["/chat", "/api/chat", "/rag", "/api/rag"];
      const body = { text: userText };

      for (const ep of endpoints) {
        try {
          const res = await fetch(`${API_BASE}${ep}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const json = (await res.json()) as unknown;
            const reply = extractReply(json);
            if (reply) return reply;
            return `Server responded (JSON) but reply field was not found:\n${safeJsonStringify(json)}`;
          } else {
            const text = await res.text();
            if (text && text.trim()) return text;
          }
        } catch {
        }
      }
      return null;
    },
    [API_BASE]
  );

  const onSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;

    setDraft("");
    appendMsg("user", text);
    setBusy(true);

    try {
      const reply = await sendToServer(text);
      if (reply) {
        appendMsg("assistant", reply);
      } else {
        appendMsg(
          "assistant",
          API_BASE
            ? "I couldn't get a reply from the server (endpoint not found or error)."
            : "Offline mode: no server call was made."
        );
      }
    } catch (e) {
      appendMsg("assistant", `Error: ${String(e)}`);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
      setTimeout(() => scrollToBottom(true), 0);
    }
  }, [API_BASE, appendMsg, busy, draft, scrollToBottom, sendToServer]);

  const openLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      appendMsg("assistant", `Couldn't open: ${url}`);
    }
  }, [appendMsg]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.top}>
        <View style={[styles.container, { maxWidth: CONTENT_MAX_W }]}>
          <View style={[styles.headerRow, isNarrow && { flexDirection: "column", alignItems: "flex-start", gap: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>HOS_BABEL</Text>
              <Text style={styles.sub}>{headerText}</Text>
            </View>

            <View style={[styles.headerActions, isNarrow && { alignSelf: "stretch" }]}>
              <Pressable style={styles.linkBtn} onPress={() => openLink(REPO_URL_PAGE)}>
                <Text style={styles.linkBtnText}>Open Web</Text>
              </Pressable>
              <Pressable style={styles.linkBtn} onPress={() => openLink(REPO_URL)}>
                <Text style={styles.linkBtnText}>Repo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mid}>
        <View style={[styles.container, { maxWidth: CONTENT_MAX_W, flex: 1 }]}>
          <View style={styles.card}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollToBottom(false)}
            >
              {msgs.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    m.role === "user" ? styles.bubbleUser : m.role === "assistant" ? styles.bubbleAsst : styles.bubbleSys,
                  ]}
                >
                  <Text style={styles.bubbleRole}>
                    {m.role.toUpperCase()}{" "}
                    <Text style={styles.bubbleTs}>
                      {new Date(m.ts).toLocaleTimeString()}
                    </Text>
                  </Text>
                  <Text style={styles.bubbleText}>{m.text}</Text>
                </View>
              ))}

              {busy && (
                <View style={[styles.bubble, styles.bubbleAsst]}>
                  <Text style={styles.bubbleRole}>ASSISTANT</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <ActivityIndicator />
                    <Text style={styles.bubbleText}>Thinking…</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message…"
                placeholderTextColor={SUB}
                multiline
                editable={!busy}
              />
              <Pressable
                style={[styles.sendBtn, (busy || !draft.trim()) && styles.sendBtnDisabled]}
                onPress={onSend}
                disabled={busy || !draft.trim()}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </Pressable>
            </View>

            {!!API_BASE && apiStatus === "error" && (
              <Text style={styles.warn}>
                API looks unreachable. Check EXPO_PUBLIC_API_BASE or backend container.
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.bottomPad} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  top: {
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  mid: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  bottomPad: { height: 12 },

  container: {
    width: "100%",
    alignSelf: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },

  title: { color: TXT, fontSize: 20, fontWeight: "700" },
  sub: { color: SUB, marginTop: 2 },

  linkBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  linkBtnText: { color: TXT, fontWeight: "600" },

  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    borderRadius: 16,
    overflow: "hidden",
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 10 },

  bubble: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#17233a",
    borderColor: "#2a3a60",
    maxWidth: "92%",
  },
  bubbleAsst: {
    alignSelf: "flex-start",
    backgroundColor: "#111a2a",
    borderColor: "#223454",
    maxWidth: "92%",
  },
  bubbleSys: {
    alignSelf: "stretch",
    backgroundColor: "#0f1522",
    borderColor: "#1c2a43",
  },
  bubbleRole: { color: ACCENT, fontWeight: "700" },
  bubbleTs: { color: SUB, fontWeight: "500" },
  bubbleText: { color: TXT, lineHeight: 20 },

  inputRow: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    color: TXT,
  },
  sendBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: { color: "#081022", fontWeight: "800" },

  warn: { color: "#ffcc66", paddingHorizontal: 12, paddingBottom: 10 },
});
