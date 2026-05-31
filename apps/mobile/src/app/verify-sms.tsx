import { useCallback, useLayoutEffect, useRef, useState } from 'react';
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
  type ConfirmationResult,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, firebaseConfig } from '../firebase/config';
import { toE164 } from '../firebase/phoneAuth';
import { useCreateSession } from '../api/hooks';
import { setSession } from '../api/session';

function sendSmsErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === 'auth/invalid-phone-number') {
      return 'מספר הטלפון אינו תקין.';
    }
    if (err.code === 'auth/too-many-requests') {
      return 'יותר מדי ניסיונות. המתן מעט ונסה שוב.';
    }
    if (
      err.code === 'auth/captcha-check-failed' ||
      err.code === 'auth/missing-client-identifier'
    ) {
      return 'אימות reCAPTCHA נכשל. נסה שוב.';
    }
    return `שליחת קוד האימות נכשלה (${err.code}).`;
  }
  return 'שליחת קוד האימות נכשלה. נסה שוב.';
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
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = useRef<(TextInput | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { mutateAsync: createSession } = useCreateSession();
  const e164Phone = phoneNumber ? toE164(phoneNumber) : '';

  const sendSms = useCallback(async () => {
    if (!phoneNumber || !e164Phone) return;

    const verifier = recaptchaVerifier.current;
    if (!verifier) {
      setError('reCAPTCHA עדיין נטען. נסה שוב בעוד רגע.');
      return;
    }

    setError(null);
    setSending(true);
    try {
      const result = await signInWithPhoneNumber(auth, e164Phone, verifier);
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

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={false}
      />
      <View>
        <Text style={styles.title}>אימות מספר טלפון</Text>
        <Text style={styles.subText}>הזן את הקוד שנשלח ל-{phoneNumber}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.digitsContainer}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { digitRefs.current[i] = el; }}
              style={[styles.digitInput, digit ? styles.digitInputFilled : null]}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleDigitKeyPress(nativeEvent.key, i)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              autoFocus={i === 0}
            />
          ))}
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
  digitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  digitInput: {
    width: 44,
    height: 52,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
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
