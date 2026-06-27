import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useLogin } from '../api/hooks';
import { classifyApiError } from '../api/errorClassifier';
import {
  getLoginBanner,
  getLoginFieldErrors,
  LoginFieldErrors,
} from '../utils/loginErrors';

const LOGO_ASPECT = 321 / 270;

export default function LoginScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const logoHeight = Math.round(
    Math.min(96, Math.max(80, windowHeight * 0.11)),
  );
  const logoWidth = Math.round(logoHeight * LOGO_ASPECT);
  const topPadding = Math.round(
    Math.min(20, Math.max(10, windowHeight * 0.02)),
  );

  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const { mutate: login, isPending } = useLogin();
  const phoneInputRef = useRef<TextInput>(null);

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
    Keyboard.dismiss();
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: topPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View>
              <Image
                source={require('../../assets/images/logo-login.png')}
                style={[styles.logo, { width: logoWidth, height: logoHeight }]}
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
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  placeholder="פורמט 9 ספרות, כולל ספרת ביקורת"
                  placeholderTextColor="#aaa"
                  textAlign="right"
                />
                {fieldErrors.idNumber && (
                  <Text style={styles.fieldErrorText}>
                    {fieldErrors.idNumber}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>מספר טלפון נייד</Text>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="לדוגמה: 0541234567"
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  textAlign="right"
                />
                {fieldErrors.phoneNumber && (
                  <Text style={styles.fieldErrorText}>
                    {fieldErrors.phoneNumber}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() =>
                  void Linking.openURL('mailto:mandalatlev@gmail.com')
                }
              >
                <Text style={styles.linkText}>נתקלת בבעיה? צור איתנו קשר</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.donationButton}
                onPress={() =>
                  void Linking.openURL(
                    'https://www.mandalathalev.org.il/%D7%AA%D7%A8%D7%95%D7%9E%D7%94-%D7%9C%D7%A2%D7%9E%D7%95%D7%AA%D7%94',
                  )
                }
              >
                <Text style={styles.donationButtonText}>לתרומות ♥</Text>
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
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: 2,
  },
  welcome: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
  },
  subText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  inputContainer: { marginHorizontal: 20, marginBottom: 15 },
  label: {
    textAlign: 'auto' as const,
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
    marginHorizontal: '20%',
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
    textAlign: 'auto' as const,
    marginTop: 4,
  },
});
