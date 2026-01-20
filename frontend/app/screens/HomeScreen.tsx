import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from "react-native";

type Phase = "LOGIN_USER" | "LOGIN_PASS" | "ERROR" | "BABEL";

const BG = "#000000";
const FG_NORMAL = "#ffffff";
const FG_BABEL = "#ff2a2a";

const MAX_LINES = 800;

const BABEL_TOKEN = "BABEL ";
const BABEL_INTERVAL_MS = 500;
const WRAP_COL = 72;

const BOOT_MS = 9300;

const INTRO_LINES: string[] = [
  "attach cd 01 /",
  "enter author password",
  "pass: E.HOBA",
  "Go to, let us go down, and there confound their language,",
  "that they may not understand one another's speech.",
  "GENESIS 11:7",
];

type LineKind = "normal" | "babel";
type Line = { id: number; text: string; kind: LineKind };

function monoFont() {
  return Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
}

function BootAnimation({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const minSide = Math.min(width, height);
  const baseSquare = Math.max(18, Math.floor(minSide * 0.06));
  const outerFrame = Math.floor(minSide * 0.72);
  const innerFrame = Math.floor(minSide * 0.42);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: BOOT_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => {
      progress.stopAnimation();
    };
  }, [onDone, progress]);

  const crossOpacity = progress.interpolate({
    inputRange: [0.03, 0.07, 1],
    outputRange: [0, 1, 1],
  });

  const redOpacity = progress.interpolate({
    inputRange: [0.05, 0.10, 0.36, 0.44],
    outputRange: [0, 1, 1, 0],
  });
  const redScale = progress.interpolate({
    inputRange: [0.05, 0.12, 0.18, 0.25],
    outputRange: [0.05, 0.45, 2.4, 12],
  });
  const redRotate = progress.interpolate({
    inputRange: [0.05, 0.12, 0.18, 0.25],
    outputRange: ["0deg", "-8deg", "-18deg", "0deg"],
  });

  const innerMarkOpacity = progress.interpolate({
    inputRange: [0.17, 0.24, 0.36],
    outputRange: [0, 0.8, 0],
  });

  const frameOpacity = progress.interpolate({
    inputRange: [0.38, 0.48, 1],
    outputRange: [0, 1, 1],
  });
  const frameScale = progress.interpolate({
    inputRange: [0.38, 0.48],
    outputRange: [0.985, 1],
  });

  const emblemOpacity = progress.interpolate({
    inputRange: [0.42, 0.55],
    outputRange: [0, 1],
  });

  const titleOpacity = progress.interpolate({
    inputRange: [0.60, 0.74],
    outputRange: [0, 1],
  });

  const scanOpacity = progress.interpolate({
    inputRange: [0.0, 0.08, 0.92, 1.0],
    outputRange: [0, 0.06, 0.06, 0],
  });
  const scanY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, height],
  });

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          opacity: 1,
        }}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          opacity: crossOpacity,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1 }}>
          <View
            style={{
              position: "absolute",
              left: 0,
              width: "44%",
              height: 1,
              backgroundColor: "rgba(150, 180, 220, 0.55)",
            }}
          />
          <View
            style={{
              position: "absolute",
              right: 0,
              width: "44%",
              height: 1,
              backgroundColor: "rgba(150, 180, 220, 0.55)",
            }}
          />
        </View>

        <View style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1 }}>
          <View
            style={{
              position: "absolute",
              top: 0,
              height: "40%",
              width: 1,
              backgroundColor: "rgba(150, 180, 220, 0.55)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              height: "40%",
              width: 1,
              backgroundColor: "rgba(150, 180, 220, 0.55)",
            }}
          />
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: baseSquare,
          height: baseSquare,
          marginLeft: -baseSquare / 2,
          marginTop: -baseSquare / 2,
          backgroundColor: "#ff2a2a",
          opacity: redOpacity,
          transform: [{ scale: redScale }, { rotate: redRotate }],
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            inset: 0,
            opacity: innerMarkOpacity,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "58%",
              height: "58%",
              borderWidth: 1,
              borderColor: "rgba(220,220,220,0.65)",
            }}
          />
          <View
            style={{
              position: "absolute",
              width: "36%",
              height: "36%",
              borderWidth: 1,
              borderColor: "rgba(180,180,180,0.55)",
              transform: [{ rotate: "45deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              width: "44%",
              height: 1,
              backgroundColor: "rgba(200,200,200,0.35)",
            }}
          />
          <View
            style={{
              position: "absolute",
              height: "44%",
              width: 1,
              backgroundColor: "rgba(200,200,200,0.35)",
            }}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: outerFrame,
          height: outerFrame,
          marginLeft: -outerFrame / 2,
          marginTop: -outerFrame / 2,
          opacity: frameOpacity,
          transform: [{ scale: frameScale }],
          borderWidth: 2,
          borderColor: "rgba(150, 180, 220, 0.55)",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: innerFrame,
            height: innerFrame,
            marginLeft: -innerFrame / 2,
            marginTop: -innerFrame / 2,
            borderWidth: 1,
            borderColor: "rgba(150, 180, 220, 0.35)",
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: innerFrame * 0.78,
            height: innerFrame * 0.78,
            marginLeft: -(innerFrame * 0.78) / 2,
            marginTop: -(innerFrame * 0.78) / 2,
            opacity: emblemOpacity,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: "90%",
              height: "90%",
              borderWidth: 2,
              borderColor: FG_BABEL,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: "78%",
              height: "78%",
              borderWidth: 2,
              borderColor: FG_BABEL,
              borderRadius: 999,
            }}
          />
          <Text
            style={{
              color: FG_BABEL,
              fontFamily: monoFont(),
              fontSize: Math.max(28, Math.floor(innerFrame * 0.22)),
              lineHeight: Math.max(30, Math.floor(innerFrame * 0.22) + 2),
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            S
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: Math.floor(outerFrame * 0.10),
            alignItems: "center",
            opacity: titleOpacity,
          }}
        >
          <Text
            style={{
              color: "#d7a24a",
              fontFamily: monoFont(),
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            Hyper Operating System
          </Text>
          <Text
            style={{
              color: "#d7a24a",
              fontFamily: monoFont(),
              fontSize: 12,
              marginTop: 2,
              letterSpacing: 0.5,
            }}
          >
            for ALL LABORS
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: Math.floor(outerFrame * 0.08),
            alignItems: "center",
            opacity: titleOpacity,
          }}
        >
          <Text style={{ color: "#b07b2f", fontFamily: monoFont(), fontSize: 10 }}>
            (c) 1989
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "#ffffff",
          opacity: scanOpacity,
          transform: [{ translateY: scanY }],
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [bootDone, setBootDone] = useState(false);

  // --- Console state ---
  const [phase, setPhase] = useState<Phase>("LOGIN_USER");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const idRef = useRef(1);
  const inputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const [lines, setLines] = useState<Line[]>(() => [
    { id: idRef.current++, text: "HOS CONSOLE", kind: "normal" },
    { id: idRef.current++, text: "", kind: "normal" },
    { id: idRef.current++, text: "LOGIN REQUIRED.", kind: "normal" },
    { id: idRef.current++, text: "", kind: "normal" },
  ]);

  const textHash = useMemo(
    () => `${lines.length}:${lines.at(-1)?.id ?? 0}:${lines.at(-1)?.text.length ?? 0}`,
    [lines]
  );

  useEffect(() => {
    if (!bootDone) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, [bootDone, textHash]);

  useEffect(() => {
    if (!bootDone) return;
    if (phase === "LOGIN_USER" || phase === "LOGIN_PASS") {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [bootDone, phase]);

  const appendLines = (texts: string[], kind: LineKind = "normal") => {
    setLines((prev) => {
      const add = texts.map((t) => ({ id: idRef.current++, text: t, kind }));
      const next = prev.concat(add);
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
  };

  const onSubmitUser = () => {
    appendLines([`user: ${user || "(blank)"}`], "normal");
    setUser("");
    setPhase("LOGIN_PASS");
  };

  const onSubmitPass = () => {
    const masked = "*".repeat(Math.min(pass.length || 1, 16));
    appendLines([`password: ${masked}`], "normal");
    setPass("");

    appendLines(["", "LOGIN FAILED.", "SELF DEFENSE PROGRAM ACTIVATED.", ""], "normal");
    appendLines(INTRO_LINES, "normal");
    appendLines([""], "normal");

    setPhase("ERROR");
    setTimeout(() => setPhase("BABEL"), 500);
  };

  useEffect(() => {
    if (!bootDone) return;
    if (phase !== "BABEL") return;

    const id = setInterval(() => {
      setLines((prev) => {
        const next = prev.slice();
        const last = next.at(-1);

        if (!last || last.kind !== "babel") {
          next.push({ id: idRef.current++, text: BABEL_TOKEN, kind: "babel" });
        } else if (last.text.length + BABEL_TOKEN.length <= WRAP_COL) {
          next[next.length - 1] = { ...last, text: last.text + BABEL_TOKEN };
        } else {
          next.push({ id: idRef.current++, text: BABEL_TOKEN, kind: "babel" });
        }

        return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
      });
    }, BABEL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [bootDone, phase]);

  // --- Boot first ---
  if (!bootDone) {
    return <BootAnimation onDone={() => setBootDone(true)} />;
  }

  // --- Console ---
  const prompt = phase === "LOGIN_USER" ? "user: " : phase === "LOGIN_PASS" ? "password: " : "";
  const promptValue = phase === "LOGIN_USER" ? user : phase === "LOGIN_PASS" ? pass : "";
  const setPromptValue = phase === "LOGIN_USER" ? setUser : setPass;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        ref={(r) => (scrollRef.current = r)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {lines.map((ln) => (
          <Text
            key={ln.id}
            style={{
              color: ln.kind === "babel" ? FG_BABEL : FG_NORMAL,
              fontFamily: monoFont(),
              fontSize: 14,
              lineHeight: 18,
              includeFontPadding: false,
            }}
          >
            {ln.text}
          </Text>
        ))}

        {(phase === "LOGIN_USER" || phase === "LOGIN_PASS") && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                color: FG_NORMAL,
                fontFamily: monoFont(),
                fontSize: 14,
                lineHeight: 18,
                includeFontPadding: false,
              }}
            >
              {prompt}
            </Text>
            <TextInput
              ref={(r) => (inputRef.current = r)}
              value={promptValue}
              onChangeText={setPromptValue}
              onSubmitEditing={(
                _e: NativeSyntheticEvent<TextInputSubmitEditingEventData>
              ) => {
                if (phase === "LOGIN_USER") onSubmitUser();
                if (phase === "LOGIN_PASS") onSubmitPass();
              }}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              secureTextEntry={phase === "LOGIN_PASS"}
              selectionColor={FG_NORMAL}
              cursorColor={FG_NORMAL}
              blurOnSubmit={false}
              returnKeyType="done"
              style={{
                flex: 1,
                color: FG_NORMAL,
                fontFamily: monoFont(),
                fontSize: 14,
                lineHeight: 18,
                padding: 0,
                margin: 0,
                ...(Platform.OS === "web"
                  ? ({
                      outlineStyle: "none",
                      outlineWidth: 0,
                      backgroundColor: "transparent",
                    } as any)
                  : null),
              }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
