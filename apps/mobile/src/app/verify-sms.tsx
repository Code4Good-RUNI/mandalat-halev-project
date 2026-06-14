import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '../firebase/config';
import { toE164 } from '../firebase/phoneAuth';
import { useCreateSession } from '../api/hooks';
import { setSession } from '../api/session';

// Firebase Auth errors (web SDK and @react-native-firebase) both carry a string
// `code` like 'auth/invalid-phone-number'; read it without coupling to either SDK.
function errorCode(err: unknown): string | undefined {
  return err && typeof err === 'object' && 'code' in err
    ? String((err as { code: unknown }).code)
    : undefined;
}

function sendSmsErrorMessage(err: unknown): string {
  const code = errorCode(err);
  if (code === 'auth/invalid-phone-number') {
    return 'מספר הטלפון אינו תקין.';
  }
  if (code === 'auth/too-many-requests') {
    return 'יותר מדי ניסיונות. המתן מעט ונסה שוב.';
  }
  if (code) {
    return `שליחת קוד האימות נכשלה (${code}).`;
  }
  return 'שליחת קוד האימות נכשלה. נסה שוב.';
}

function verifyErrorMessage(err: unknown): string {
  const code = errorCode(err);
  if (
    code === 'auth/invalid-verification-code' ||
    code === 'auth/code-expired'
  ) {
    return 'הקוד שגוי או שפג תוקפו. נסה שוב.';
  }
  return 'אירעה שגיאה באימות הקוד. נסה שוב.';
}

export default function VerifySmsScreen() {
  const { phoneNumber, idNumber } = useLocalSearchParams<{
    phoneNumber: string;
    idNumber: string;
  }>();

  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const codeInputRef = useRef<TextInput>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { mutateAsync: createSession } = useCreateSession();
  const e164Phone = phoneNumber ? toE164(phoneNumber) : '';

  const sendSms = useCallback(async () => {
    if (!phoneNumber || !e164Phone) return;

    setError(null);
    setSending(true);
    try {
      const result = await auth.signInWithPhoneNumber(e164Phone);
      setConfirmation(result);
    } catch (err) {
      setError(sendSmsErrorMessage(err));
    } finally {
      setSending(false);
    }
  }, [phoneNumber, e164Phone]);

  // Send the verification SMS once when the screen opens.
  useLayoutEffect(() => {
    void sendSms();
  }, [sendSms]);

  const handleVerify = async () => {
    if (!confirmation) return;
    setError(null);
    setVerifying(true);
    try {
      const cred = await confirmation.confirm(code);
      if (!cred) {
        setError(verifyErrorMessage(null));
        return;
      }
      const idToken = await cred.user.getIdToken();

      // Finalize the session: the server verifies the token and sets the
      // salesforceUserId custom claim; it returns { ok: true } (no token).
      const res = await createSession({
        body: { phoneNumber, idNumber },
        idToken,
      });
      if (res.status !== 200) {
        setError('סיום ההתחברות נכשל. נסה שוב.');
        return;
      }

      // Force-refresh so the new ID token carries the salesforceUserId claim
      // the server just set, then store it as the app session — protected API
      // calls attach it as the Bearer token.
      const refreshedToken = await cred.user.getIdToken(true);
      await setSession(refreshedToken);

      router.replace('/(tabs)/activities');
    } catch (err) {
      setError(verifyErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const code = digits.join('');
  const verifyDisabled = code.length !== 6 || verifying || !confirmation;

  const setCodeFromString = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < cleaned.length; i++) {
      next[i] = cleaned[i]!;
    }
    setDigits(next);
  };

  useEffect(() => {
    if (confirmation) {
      codeInputRef.current?.focus();
    }
  }, [confirmation]);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>אימות מספר טלפון</Text>
        <Text style={styles.subText}>הזן את הקוד שנשלח ל-{phoneNumber}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={styles.digitsContainer}
          onPress={() => codeInputRef.current?.focus()}
        >
          <TextInput
            ref={codeInputRef}
            value={code}
            onChangeText={setCodeFromString}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            caretHidden
            style={styles.hiddenCodeInput}
          />
          {digits.map((digit, i) => (
            <View
              key={i}
              style={[styles.digitBox, digit ? styles.digitInputFilled : null]}
            >
              <Text style={styles.digitText}>{digit}</Text>
            </View>
          ))}
        </Pressable>

        <TouchableOpacity onPress={sendSms} disabled={sending}>
          <Text style={styles.linkText}>
            {sending ? 'שולח קוד...' : 'שליחת קוד מחדש'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>חזרה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.verifyButton, verifyDisabled && { opacity: 0.6 }]}
          disabled={verifyDisabled}
          onPress={handleVerify}
        >
          <Text style={styles.verifyButtonText}>
            {verifying ? 'מאמת...' : 'אמת'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 20,
    marginTop: 40,
  },
  subText: {
    fontSize: 18,
    textAlign: 'right',
    marginRight: 20,
    marginBottom: 20,
  },
  digitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
    position: 'relative',
  },
  hiddenCodeInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: 'transparent',
  },
  digitBox: {
    width: 44,
    height: 52,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  digitInputFilled: {
    borderBottomColor: '#FF8C00',
  },
  linkText: { textAlign: 'center', marginTop: 20, color: '#666' },
  verifyButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center' as const,
    marginHorizontal: 15,
    marginBottom: 10,
  },
});
