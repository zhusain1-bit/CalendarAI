import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  message?: string;
}

export default function SubscriptionBanner({ message }: Props) {
  const router = useRouter();

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⭐</Text>
      <View style={styles.content}>
        <Text style={styles.message}>
          {message ?? 'Subscribe to create unlimited calendar events from screenshots.'}
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            Platform.OS === 'web'
              ? router.push('/pricing')
              : router.push('/(app)/account')
          }
        >
          <Text style={styles.btnText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  icon: { fontSize: 22 },
  content: { flex: 1, gap: 8 },
  message: { fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  btn: {
    backgroundColor: '#0066FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
