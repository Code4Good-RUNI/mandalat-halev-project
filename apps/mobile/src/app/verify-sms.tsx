import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

// TODO(feat/firebase-sms-login): when this screen mounts, trigger the Firebase
// phone-auth SMS via signInWithPhoneNumber(phoneNumber) (with the recaptcha
// verifier) and keep the resulting confirmationResult for handleVerify below.
// idNumber is carried here so the eligibility check can be tied to the code.

export default function VerifySmsScreen() {
  const { phoneNumber } = useLocalSearchParams<{
    phoneNumber: string;
    idNumber: string;
  }>();
  const [code, setCode] = useState('');

  const handleVerify = () => {
    // TODO(feat/firebase-sms-login): confirm `code` against the Firebase
    // confirmationResult, then call /auth/session with the Firebase token,
    // setSession(...), and router.replace('/(tabs)/activities').
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>אימות מספר טלפון</Text>
        <Text style={styles.subText}>
          הזן את הקוד שנשלח ל-{phoneNumber}
        </Text>

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

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>חזרה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.verifyButton, code.length !== 6 && { opacity: 0.6 }]}
          disabled={code.length !== 6}
          onPress={handleVerify}
        >
          <Text style={styles.verifyButtonText}>אמת</Text>
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
});
