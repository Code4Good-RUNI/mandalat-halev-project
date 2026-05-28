import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useLogin } from '../api/hooks';
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
        onSuccess: (data) => {
          if (data.status === 200) {
            // The user exists. Move to SMS verification, carrying the phone
            // and ID so that screen can run the Firebase phone-auth step.
            router.push({
              pathname: '/verify-sms',
              params: { phoneNumber, idNumber },
            });
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
      <View style={styles.inner}>
        <View>
          <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
              placeholder="פורמט 9 ספרות, כולל ספרת ביקורת"
              placeholderTextColor="#aaa"
              textAlign="right"
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
              placeholder="לדוגמה: 0541234567"
              keyboardType="numeric"
              textAlign="right"
            />
            {fieldErrors.phoneNumber && (
              <Text style={styles.fieldErrorText}>{fieldErrors.phoneNumber}</Text>
            )}
          </View>

          <TouchableOpacity onPress={() => void Linking.openURL('mailto:mandalatlev@gmail.com')}>
            <Text style={styles.linkText}>נתקלת בבעיה? צור איתנו קשר</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.donationButton}
            onPress={() => void Linking.openURL('https://www.mandalathalev.org.il/%D7%AA%D7%A8%D7%95%D7%9E%D7%94-%D7%9C%D7%A2%D7%9E%D7%95%D7%AA%D7%94')}
          >
            <Text style={styles.donationButtonText}>לתרומות ♥</Text>
          </TouchableOpacity>
        </View>

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
  inner: { flex: 1, justifyContent: 'space-between', paddingBottom: 24 },
  logo: { width: 150, height: 115, alignSelf: 'center', marginTop: 40 },
  welcome: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  subText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: { marginHorizontal: 20, marginBottom: 15 },
  label: {
    textAlign: 'right' as const,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    textDecorationLine: 'underline',
  },
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
  donationButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 80,
  },
  donationButtonText: {
    color: '#fff',
    fontSize: 12,
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
