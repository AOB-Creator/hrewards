import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, api } from '@/data';
import { formatPhone } from '@/domain/validation';
import { useNotifications } from '@/hooks/useNotifications';
import { useT } from '@/i18n';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { IconButton } from '@/ui/IconButton';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, fonts, radius } from '@/ui/theme';

const LEN = 4;

export default function Otp() {
  const params = useLocalSearchParams<{ phone: string; debug?: string; resendIn?: string }>();
  const { t } = useT();
  const signIn = useSession((s) => s.signIn);
  const setUser = useSession((s) => s.setUser);
  const loadNotifs = useNotifications((s) => s.load);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [debug, setDebug] = useState(params.debug);
  const [left, setLeft] = useState(Number(params.resendIn ?? 60));
  const [loading, setLoading] = useState(false);
  const [profileStep, setProfileStep] = useState<{ token: string } | null>(null);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const i = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, []);

  const finish = () => {
    loadNotifs();
    router.dismissAll();
  };

  const verify = async (value: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const r = await api.verifyOtp(params.phone, value);
      signIn(r.token, r.user);
      if (r.isNew || !r.user.firstName) setProfileStep({ token: r.token });
      else finish();
    } catch (e) {
      setCode('');
      if (e instanceof ApiError) setError(t(`err.${e.code}`, { n: String(e.details?.attemptsLeft ?? 0) }));
      else setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const r = await api.requestOtp(params.phone);
      setDebug(r.debugCode);
      setLeft(r.resendIn);
      setError(undefined);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'otp_too_soon') setLeft(Number(e.details?.resendIn ?? 60));
    }
  };

  if (profileStep) {
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView style={{ flex: 1, padding: 20 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, gap: 14, paddingTop: 40 }}>
            <Text variant="h1">{t('auth.completeTitle')}</Text>
            <Text variant="body" muted>
              {t('auth.completeSubtitle')}
            </Text>
            <Field label={t('book.firstName')} value={first} onChangeText={setFirst} autoFocus autoComplete="given-name" />
            <Field label={t('book.lastName')} value={last} onChangeText={setLast} autoComplete="family-name" />
          </View>
          <Button
            title={t('common.continue')}
            disabled={!first.trim()}
            loading={loading}
            onPress={async () => {
              setLoading(true);
              try {
                setUser(await api.updateProfile(profileStep.token, { firstName: first.trim(), lastName: last.trim() }));
                finish();
              } finally {
                setLoading(false);
              }
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <IconButton label={t('common.back')} onPress={() => router.back()}>
            <ChevronLeft size={22} color={colors.ink} strokeWidth={1.6} />
          </IconButton>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 28, gap: 8 }}>
          <Text variant="h1">{t('auth.otpTitle')}</Text>
          <Text variant="body" muted>
            {t('auth.otpSubtitle', { phone: formatPhone(params.phone) })}
          </Text>
          <Pressable onPress={() => input.current?.focus()} style={styles.cells}>
            {Array.from({ length: LEN }, (_, i) => (
              <View key={i} style={[styles.cell, code.length === i && styles.cellActive, !!error && { borderColor: colors.danger }]}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 26 }}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            ref={input}
            value={code}
            onChangeText={(v) => {
              const c = v.replace(/\D/g, '').slice(0, LEN);
              setCode(c);
              if (c.length === LEN) verify(c);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
            maxLength={LEN}
            style={styles.hidden}
            testID="otp-input"
          />
          {!!error && (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          )}
          {!!debug && (
            <View style={{ marginTop: 8 }}>
              <Tag tone="warning" label={t('auth.demoCode', { code: debug })} />
            </View>
          )}
          <Pressable disabled={left > 0} onPress={resend} style={{ marginTop: 16 }}>
            <Text variant="label" color={left > 0 ? colors.muted : colors.ink}>
              {left > 0 ? t('auth.resendIn', { s: left }) : t('auth.resend')}
            </Text>
          </Pressable>
        </View>
        <View style={{ padding: 20 }}>
          <Button title={t('common.continue')} disabled={code.length < LEN} loading={loading} onPress={() => verify(code)} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  cells: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cell: { width: 64, height: 68, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cellActive: { borderColor: colors.ink, borderWidth: 1.5 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
