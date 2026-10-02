import { useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { api } from '@/data';
import type { Currency, Locale, NotificationPrefs } from '@/domain/types';
import { isValidEmail } from '@/domain/validation';
import { LOCALE_NAMES, useT } from '@/i18n';
import { useSession } from '@/store/session';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';

type Section = 'personal' | 'notifications' | 'language' | 'currency';

export default function Settings() {
  const { section = 'language' } = useLocalSearchParams<{ section?: Section }>();
  const { t } = useT();
  const title = { personal: t('profile.personal'), notifications: t('profile.notifications'), language: t('profile.language'), currency: t('profile.currency') }[section];
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title={title} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
          {section === 'language' && <LanguagePicker />}
          {section === 'currency' && <CurrencyPicker />}
          {section === 'personal' && <Personal />}
          {section === 'notifications' && <Notifications />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Choice({ label, selected, onPress, hint }: { label: string; selected: boolean; onPress(): void; hint?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && { borderColor: colors.ink, borderWidth: 1.5 }]} accessibilityRole="radio" accessibilityState={{ selected }}>
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {hint && (
          <Text variant="caption" muted>
            {hint}
          </Text>
        )}
      </View>
      {selected && <Check size={18} color={colors.ink} />}
    </Pressable>
  );
}

function LanguagePicker() {
  const { locale, setLocale } = useSettings();
  return (
    <>
      {(Object.keys(LOCALE_NAMES) as Locale[]).map((l) => (
        <Choice key={l} label={LOCALE_NAMES[l]} selected={locale === l} onPress={() => setLocale(l)} />
      ))}
    </>
  );
}

function CurrencyPicker() {
  const { currency, setCurrency, fx } = useSettings();
  const options: { c: Currency; hint: string }[] = [
    { c: 'UZS', hint: "O'zbek so'mi" },
    { c: 'USD', hint: `1 USD = ${Math.round(fx.USD)} UZS` },
    { c: 'EUR', hint: `1 EUR = ${Math.round(fx.EUR)} UZS` },
  ];
  return (
    <>
      {options.map((o) => (
        <Choice key={o.c} label={o.c} hint={o.hint} selected={currency === o.c} onPress={() => setCurrency(o.c)} />
      ))}
    </>
  );
}

function Personal() {
  const { t } = useT();
  const { token, user, setUser } = useSession();
  const [form, setForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '', citizenship: user?.citizenship ?? 'UZ', birthDate: user?.birthDate ?? '' });
  const [saving, setSaving] = useState(false);
  if (!token || !user) return null;
  const emailError = form.email && !isValidEmail(form.email) ? t('book.invalidEmail') : undefined;
  return (
    <>
      <Field label={t('book.phone')} value={user.phone} editable={false} filled />
      <Field label={t('book.firstName')} value={form.firstName} onChangeText={(firstName) => setForm({ ...form, firstName })} />
      <Field label={t('book.lastName')} value={form.lastName} onChangeText={(lastName) => setForm({ ...form, lastName })} />
      <Field label={t('book.email')} value={form.email} onChangeText={(email) => setForm({ ...form, email })} keyboardType="email-address" autoCapitalize="none" error={emailError} />
      <Field label={t('book.citizenship')} value={form.citizenship} onChangeText={(citizenship) => setForm({ ...form, citizenship })} autoCapitalize="characters" />
      <Field label={t('profile.birthDate')} value={form.birthDate} onChangeText={(birthDate) => setForm({ ...form, birthDate })} placeholder="1990-05-21" />
      <Button
        title={t('common.save')}
        loading={saving}
        disabled={!!emailError || !form.firstName.trim()}
        style={{ marginTop: 8 }}
        onPress={async () => {
          setSaving(true);
          try {
            setUser(await api.updateProfile(token, { ...form, birthDate: form.birthDate || undefined }));
            Alert.alert(t('profile.saved'));
          } catch {
            Alert.alert(t('common.error'));
          } finally {
            setSaving(false);
          }
        }}
      />
    </>
  );
}

function Notifications() {
  const { t } = useT();
  const { token, user, setUser } = useSession();
  if (!token || !user) return null;
  const toggle = async (k: keyof NotificationPrefs, v: boolean) => {
    const prefs = { ...user.notificationPrefs, [k]: v };
    setUser({ ...user, notificationPrefs: prefs });
    try {
      setUser(await api.updateProfile(token, { notificationPrefs: prefs }));
    } catch {
      setUser(user);
    }
  };
  return (
    <View style={styles.box}>
      {(['sms', 'email', 'push', 'marketing'] as (keyof NotificationPrefs)[]).map((k, i, arr) => (
        <View key={k} style={[styles.switchRow, i < arr.length - 1 && { borderBottomWidth: 1, borderColor: colors.border }]}>
          <Text variant="body" style={{ flex: 1 }}>
            {t(`notif.${k}`)}
          </Text>
          <Switch value={user.notificationPrefs[k]} onValueChange={(v) => toggle(k, v)} trackColor={{ true: colors.ink, false: colors.border }} thumbColor={colors.white} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  choice: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  box: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', height: 58 },
});
