import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useLogin } from '../api/hooks';
import { setSession } from '../api/session';
import { classifyApiError } from '../api/errorClassifier';
import {
  getLoginBanner,
  getLoginFieldErrors,
  LoginFieldErrors,
} from './_loginErrors';

export default function LoginScreen() {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const { mutate: login, isPending } = useLogin();
  const queryClient = useQueryClient();

  const handleIdChange = (text: string) => {
    setIdNumber(text);
    if (fieldErrors.idNumber) {
      setFieldErrors((prev) => ({ ...prev, idNumber: undefined }));
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    if (fieldErrors.phoneNumber) {
      setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const handleSubmit = () => {
    setBanner(null);
    setFieldErrors({});

    login(
      { phoneNumber, idNumber },
      {
        onSuccess: async (data) => {
          if (data.status === 200) {
            await setSession({
              accessToken: data.body.accessToken,
              salesforceUserId: data.body.salesforceUserId,
            });
            await queryClient.invalidateQueries();
            router.replace('/(tabs)/activities');
            return;
          }
          const apiError = classifyApiError({ data });
          if (!apiError) return;
          if (apiError.kind === 'validation') {
            setFieldErrors(getLoginFieldErrors(apiError.issues));
          } else {
            setBanner(getLoginBanner(apiError));
          }
        },
        onError: (err) => {
          const apiError = classifyApiError({ error: err }) ?? {
            kind: 'unknown' as const,
          };
          setBanner(getLoginBanner(apiError));
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.logo}>[Logo Here]</Text>
        <Text style={styles.welcome}>שלום!</Text>
        <Text style={styles.subText}>התחבר על מנת להמשיך</Text>

        {banner && <Text style={styles.errorText}>{banner}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>מספר תעודת זהות</Text>
          <TextInput
            style={styles.input}
            value={idNumber}
            onChangeText={handleIdChange}
            keyboardType="numeric"
          />
          {fieldErrors.idNumber && (
            <Text style={styles.fieldErrorText}>{fieldErrors.idNumber}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>מספר טלפון נייד</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="numeric"
          />
          {fieldErrors.phoneNumber && (
            <Text style={styles.fieldErrorText}>{fieldErrors.phoneNumber}</Text>
          )}
        </View>

        <TouchableOpacity>
          <Text style={styles.linkText}>נתקלת בבעיה? צור איתנו קשר</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text>🤍 לתרומות</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, isPending && { opacity: 0.6 }]}
          disabled={isPending}
          onPress={handleSubmit}
        >
          <Text style={styles.loginButtonText}>
            {isPending ? 'מתחבר...' : 'התחבר'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  logo: { fontSize: 24, textAlign: 'center', marginTop: 40 },
  welcome: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 20,
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
  loginButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  loginButtonText: {
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
  fieldErrorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'right' as const,
    marginTop: 4,
  },
});
