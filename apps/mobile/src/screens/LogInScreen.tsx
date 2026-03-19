import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, TouchableOpacity } from 'react-native';

interface LoginScreenProps {
  onTempPress: () => void;
}

export const LoginScreen = ({ onTempPress }: LoginScreenProps) => {
    const [idNumber, setIdNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    return (
    <SafeAreaView>
        <View>
        
        {/* Logo and Titles */}
        <Text>[Logo Here]</Text>
        <Text>שלום!</Text>
        <Text>התחבר על מנת להמשיך</Text>

        {/* ID Input */}
        <View>
          <Text>מספר תעודת זהות</Text>
          <TextInput
            placeholder="פורמט 9 ספרות, כולל ספרת ביקורת"
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="numeric"
          />
        </View>

        {/* Phone Input */}
        <View>
          <Text>מספר טלפון נייד</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="numeric"
          />
        </View>

        {/* Buttons */}
        <TouchableOpacity>
          <Text>נתקלת בבעיה? צור איתנו קשר</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text>🤍 לתרומות</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Text>התחבר</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onTempPress}>
          <Text>עבור לפרופיל (זמני)</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};