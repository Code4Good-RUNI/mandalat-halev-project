import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import {
  signInWithPhoneNumber,
  type ApplicationVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, firebaseConfig } from '../firebase/config';
import { useCreateSession } from '../api/hooks';
import { setSession } from '../api/session';

// Firebase Phone Auth needs E.164 format (+972501234567). Users may type local
// Israeli formats (0501234567 / 050-1234567), or paste +972... / 972...
function toE164(phone: string): string {
  const trimmed = (phone ?? '').trim();
  if (!trimmed) return '';

  // Keep only digits; we re-add the '+' ourselves.
  const digits = trimmed.replace(/\D/g, '');

  // Already has country code (with or without '+')
  if (digits.startsWith('972')) {
    return `+${digits}`;
  }

  // Local Israeli: 0XXXXXXXXX
  if (digits.startsWith('0')) {
    return `+972${digits.slice(1)}`;
  }

  // Local without leading 0 (rare, but happens): 5XXXXXXXX (9 digits)
  if (digits.length === 9 && digits.startsWith('5')) {
    return `+972${digits}`;
  }

  // Fallback: return as-is (likely to fail fast with a clear Firebase error)
  return `+${digits}`;
}

function verifyErrorMessage(err: unknown): string {
  if (
    err instanceof FirebaseError &&
    (err.code === 'auth/invalid-verification-code' ||
      err.code === 'auth/code-expired')
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

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { mutateAsync: createSession } = useCreateSession();

  const sendSms = useCallback(async () => {
    if (!phoneNumber) return;
    // expo-firebase-recaptcha's WebView verifier hangs on this project's
    // Enterprise→v2 reCAPTCHA fallback. In dev, bypass it with a stub verifier;
    // paired with appVerificationDisabledForTesting + a registered Firebase
    // test number, signInWithPhoneNumber resolves with no WebView. Prod uses
    // the modal.
    const verifier = __DEV__
      ? ({
          type: 'recaptcha',
          verify: () => Promise.resolve('test'),
          _reset: () => undefined, // SDK calls _reset() in a finally block
        } as unknown as ApplicationVerifier)
      : (recaptchaVerifier.current as ApplicationVerifier | null);
    if (!verifier) return;
    setError(null);
    setSending(true);
    try {
      const result = await signInWithPhoneNumber(
        auth,
        toE164(phoneNumber),
        verifier,
      );
      setConfirmation(result);
    } catch {
      setError('שליחת קוד האימות נכשלה. נסה שוב.');
    } finally {
      setSending(false);
    }
  }, [phoneNumber]);

  // Send the verification SMS once when the screen opens.
  useEffect(() => {
    void sendSms();
  }, [sendSms]);

  const handleVerify = async () => {
    if (!confirmation) return;
    setError(null);
    setVerifying(true);
    try {
      const cred = await confirmation.confirm(code);
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

  const verifyDisabled = code.length !== 6 || verifying || !confirmation;

  return (
    <SafeAreaView style={styles.container}>
      {!__DEV__ && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification
        />
      )}
      <View>
        <Text style={styles.title}>אימות מספר טלפון</Text>
        <Text style={styles.subText}>הזן את הקוד שנשלח ל-{phoneNumber}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>קוד אימות</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

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
  inputContainer: { marginHorizontal: 20, marginBottom: 15 },
  label: {
    textAlign: 'right' as const,
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'right' as const,
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
