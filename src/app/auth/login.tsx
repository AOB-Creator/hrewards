import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/Wordmark';
import { ApiError, api, isDemoBackend } from '@/data';
import { isValidPhone, normalizePhone } from '@/domain/validation';
import { useT } from '@/i18n';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Text } from '@/ui/Text';
import { colors } from '@/ui/theme';

export default function Login() {
  const { t } = useT();
  const [phone, setPhone] = useState('+998 ');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!isValidPhone(phone)) return setError(t('err.invalid_phone'));
    setError(undefined);
    setLoading(true);
    try {
      const r = await api.requestOtp(phone);
      router.push({ pathname: '/auth/otp', params: { phone: normalizePhone(phone), debug: r.debugCode ?? '', resendIn: String(r.resendIn) } });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'otp_too_soon') {
        // A code was already sent recently: go enter it.
        router.push({ pathname: '/auth/otp', params: { phone: normalizePhone(phone), debug: '', resendIn: String(e.details?.resendIn ?? 60) } });
      } else setError(e instanceof ApiError ? t(`err.${e.code}`) : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Wordmark size={18} />
          <Pressable accessibilityLabel={t('common.close')} onPress={() => router.back()} hitSlop={10}>
            <X size={22} color={colors.ink} strokeWidth={1.6} />
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text variant="h1">{t('auth.title')}</Text>
          <Text variant="body" muted>
            {t('auth.subtitle')}
          </Text>
          <View style={{ marginTop: 18 }}>
            <Field label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" autoFocus error={error} onSubmitEditing={send} testID="phone-input" />
          </View>
          {isDemoBackend && (
            <Pressable onPress={() => setPhone('+998 90 123 45 67')}>
              <Text variant="caption" muted>
                {t('auth.demoHint')}
              </Text>
            </Pressable>
          )}
        </View>
        <View style={styles.footer}>
          <Button title={t('auth.sendCode')} onPress={send} loading={loading} testID="send-code" />
          <Button title={t('auth.skip')} variant="ghost" size="md" onPress={() => router.back()} />
          <Text variant="caption" muted center>
            {t('auth.terms')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 36, gap: 8 },
  footer: { paddingHorizontal: 20, paddingBottom: 12, gap: 6 },
});
