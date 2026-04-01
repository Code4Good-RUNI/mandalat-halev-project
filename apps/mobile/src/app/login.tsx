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

export default function LoginScreen() {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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

        <TouchableOpacity>
          <Text>נתקלת בבעיה? צור איתנו קשר</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text>🤍 לתרומות</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/(tabs)/activities')}
        >
          <Text style={styles.loginButtonText}>התחבר</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
