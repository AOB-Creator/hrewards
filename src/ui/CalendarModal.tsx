import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/i18n';
import { addDays, diffDays, formatLongDate, toISODate, today } from '@/utils/date';
import { Button } from './Button';
import { Text } from './Text';
import { colors } from './theme';

interface Props {
  visible: boolean;
  checkIn: string;
  checkOut: string;
  onClose(): void;
  onApply(checkIn: string, checkOut: string): void;
  maxNights?: number;
}

const WEEK: Record<string, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
};
const MONTHS: Record<string, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
};

function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= days; d++) cells.push(toISODate(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Range date picker: tap check-in, then check-out. */
export function CalendarModal({ visible, checkIn, checkOut, onClose, onApply, maxNights = 30 }: Props) {
  const { t, locale } = useT();
  const insets = useSafeAreaInsets();
  const [start, setStart] = useState<string | null>(checkIn);
  const [end, setEnd] = useState<string | null>(checkOut);
  const t0 = today();

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 13 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const onDay = (d: string) => {
    if (d < t0) return;
    if (!start || end || d <= start) {
      setStart(d);
      setEnd(null);
    } else if (diffDays(start, d) <= maxNights) {
      setEnd(d);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={() => { setStart(checkIn); setEnd(checkOut); }}>
      <View style={[styles.root, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text variant="h3">{t('search.selectDates')}</Text>
          <Pressable accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={10} style={styles.close}>
            <X size={22} color={colors.ink} strokeWidth={1.6} />
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {(WEEK[locale] ?? WEEK.en).map((w) => (
            <Text key={w} variant="caption" muted style={styles.weekCell}>
              {w}
            </Text>
          ))}
        </View>
        <FlatList
          data={months}
          keyExtractor={(m) => m.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <View style={{ marginTop: 16 }}>
              <Text variant="title" style={{ marginBottom: 10, marginLeft: 6 }}>
                {(MONTHS[locale] ?? MONTHS.en)[item.month]} {item.year}
              </Text>
              <View style={styles.grid}>
                {monthCells(item.year, item.month).map((d, i) => {
                  if (!d) return <View key={i} style={styles.cell} />;
                  const disabled = d < t0;
                  const isStart = d === start;
                  const isEnd = d === end;
                  const between = start && end && d > start && d < end;
                  return (
                    <Pressable key={d} disabled={disabled} onPress={() => onDay(d)} style={styles.cell} accessibilityLabel={d}>
                      {between && <View style={styles.band} />}
                      {isStart && end && <View style={[styles.band, { left: '50%' }]} />}
                      {isEnd && <View style={[styles.band, { right: '50%' }]} />}
                      <View style={[styles.day, (isStart || isEnd) && styles.daySel]}>
                        <Text variant="small" color={isStart || isEnd ? colors.white : disabled ? colors.faint : colors.ink}>
                          {Number(d.slice(8))}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        />
        <View style={styles.footer}>
          <Text variant="small" muted style={{ flex: 1 }}>
            {start ? formatLongDate(start, locale) : '—'} → {end ? formatLongDate(end, locale) : '—'}
            {start && end ? ` · ${diffDays(start, end)} ${t('common.nights')}` : ''}
          </Text>
          <Button
            title={t('common.apply')}
            size="md"
            disabled={!start || !end}
            onPress={() => start && end && onApply(start, end)}
          />
        </View>
      </View>
    </Modal>
  );
}

export function defaultCheckout(checkIn: string) {
  return addDays(checkIn, 1);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  close: { position: 'absolute', right: 20, top: 16 },
  weekRow: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 10 },
  weekCell: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', top: 5, bottom: 5, left: 0, right: 0, backgroundColor: colors.soft },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  daySel: { backgroundColor: colors.ink },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border },
});
