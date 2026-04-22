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
import { useLogin } from '../api/hooks';
import { getErrorMessage, getFieldErrors } from '../utils/errorMessages';

// Temporary constant to store user ID until full auth context is implemented
export let temporarySalesforceUserId: number | null = null;

const PHONE_REGEX = /^\d{10}$/;
const ID_REGEX = /^\d{9}$/;

export default function LoginScreen() {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customError, setCustomError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { mutate: login, isPending } = useLogin();

  const handleLogin = () => {
    setCustomError('');
    setFieldErrors({});

    const clientErrors: Record<string, string> = {};
    if (!PHONE_REGEX.test(phoneNumber)) {
      clientErrors.phoneNumber = 'מספר טלפון חייב להכיל 10 ספרות';
    }
    if (!ID_REGEX.test(idNumber)) {
      clientErrors.idNumber = 'תעודת זהות חייבת להכיל 9 ספרות';
    }
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    login(
      { phoneNumber, idNumber },
      {
        onSuccess: (data) => {
          if (data.status === 200) {
            temporarySalesforceUserId = data.body.salesforceUserId;
            router.replace('/(tabs)/activities');
            return;
          }
          setCustomError(getErrorMessage(data));
          if (data.status === 400) {
            setFieldErrors(getFieldErrors(data));
          }
        },
        onError: (err) => setCustomError(getErrorMessage(err)),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>[Logo Here]</Text>
        <Text style={styles.welcome}>שלום!</Text>
        <Text style={styles.subText}>התחבר על מנת להמשיך</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>מספר תעודת זהות</Text>
          <TextInput
            placeholder="פורמט 9 ספרות, כולל ספרת ביקורת"
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
          />
          {fieldErrors.idNumber && (
            <Text style={styles.fieldErrorText}>{fieldErrors.idNumber}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>מספר טלפון נייד</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
          />
          {fieldErrors.phoneNumber && (
            <Text style={styles.fieldErrorText}>{fieldErrors.phoneNumber}</Text>
          )}
        </View>

        {customError !== '' && (
          <Text style={styles.errorText}>{customError}</Text>
        )}

        <TouchableOpacity>
          <Text style={styles.linkText}>נתקלת בבעיה? צור איתנו קשר</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.donateLink}>
          <Text style={styles.donateText}>🤍 לתרומות</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, isPending && { opacity: 0.6 }]}
          disabled={isPending}
          onPress={handleLogin}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    direction: 'rtl',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  logo: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  welcome: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  subText: {
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 30,
    color: '#555',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    textAlign: 'right',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
  donateLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  donateText: {
    fontSize: 14,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  fieldErrorText: {
    color: 'red',
    marginTop: 4,
    textAlign: 'right',
    fontSize: 13,
  },
});
