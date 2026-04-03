import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useLogin } from '../api/hooks';

export default function LoginScreen() {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  return (
    <SafeAreaView>
      <View>
        <Text>[Logo Here]</Text>
        <Text>שלום!</Text>
        <Text>התחבר על מנת להמשיך</Text>

        <View>
          <Text>מספר תעודת זהות</Text>
          <TextInput
            placeholder="פורמט 9 ספרות, כולל ספרת ביקורת"
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="numeric"
          />
        </View>

        <View>
          <Text>מספר טלפון נייד</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="numeric"
          />
        </View>

        {error && <Text style={styles.errorText}>{error.message}</Text>}

        <TouchableOpacity>
          <Text style={styles.linkText}>נתקלת בבעיה? צור איתנו קשר</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text>🤍 לתרומות</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, isPending && { opacity: 0.6 }]}
          disabled={isPending}
          onPress={() =>
            login(
              { phoneNumber, idNumber },
              {
                onSuccess: () => router.replace('/(tabs)/activities'),
              },
            )
          }
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
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
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
});
