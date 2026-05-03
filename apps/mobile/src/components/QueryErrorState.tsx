import React from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const MESSAGE = 'משהו השתבש בטעינת הנתונים. אנא נסה שוב.';
const RETRY = 'נסה שוב';

export function QueryErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.text}>{MESSAGE}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>{RETRY}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: 'red', textAlign: 'center', marginBottom: 12 },
  button: {
    backgroundColor: '#FF8C00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
