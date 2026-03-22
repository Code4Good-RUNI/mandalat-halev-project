import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, TouchableOpacity } from 'react-native';


export const LoginScreen = () => {
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

        {/* Action Buttons */}
        <TouchableOpacity>
          <Text>נתקלת בבעיה? צור איתנו קשר</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text>🤍 לתרומות</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Text>התחבר</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};