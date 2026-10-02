/* eslint-disable react-hooks/refs */
import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from './theme';

interface Props {
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  buckets: number[];
  onChange(low: number, high: number): void;
}

const THUMB = 16;
const CHART_H = 64;

/** Histogram + dual-thumb slider from the search sheet. */
export function PriceRangeSlider({ min, max, step, low, high, buckets, onChange }: Props) {
  'use no memo'; // PanResponder handlers read live values from a ref
  const [width, setWidth] = useState(0);
  const state = useRef({ low, high, width, startLow: low, startHigh: high });
  state.current.low = low;
  state.current.high = high;
  state.current.width = width;

  const toX = (v: number) => ((v - min) / (max - min)) * width;
  const fromDx = (start: number, dx: number) => {
    const v = start + (dx / Math.max(1, state.current.width)) * (max - min);
    return Math.round(Math.min(max, Math.max(min, v)) / step) * step;
  };

  const lowPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => (state.current.startLow = state.current.low),
        onPanResponderMove: (_, g) => {
          const v = Math.min(fromDx(state.current.startLow, g.dx), state.current.high - step);
          onChange(v, state.current.high);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step, onChange],
  );
  const highPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => (state.current.startHigh = state.current.high),
        onPanResponderMove: (_, g) => {
          const v = Math.max(fromDx(state.current.startHigh, g.dx), state.current.low + step);
          onChange(state.current.low, v);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step, onChange],
  );

  const peak = Math.max(1, ...buckets);
  const bw = width / buckets.length;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: CHART_H + THUMB / 2 + 4 }}>
      <View style={styles.chart}>
        {buckets.map((b, i) => {
          const bucketMin = min + (i / buckets.length) * (max - min);
          const bucketMax = min + ((i + 1) / buckets.length) * (max - min);
          const inRange = bucketMax > low && bucketMin < high;
          const h = b === 0 ? 6 : 10 + (b / peak) * (CHART_H - 10);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: i * bw + 1,
                bottom: 0,
                width: Math.max(2, bw - 2.5),
                height: h,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                backgroundColor: inRange ? colors.ink : '#DCDCDF',
              }}
            />
          );
        })}
      </View>
      <View style={styles.track} />
      {width > 0 && (
        <>
          <View style={[styles.activeTrack, { left: toX(low), width: Math.max(0, toX(high) - toX(low)) }]} />
          <View {...lowPan.panHandlers} accessibilityRole="adjustable" accessibilityLabel="min price" hitSlop={16} style={[styles.thumb, { left: toX(low) - THUMB / 2 }]} />
          <View {...highPan.panHandlers} accessibilityRole="adjustable" accessibilityLabel="max price" hitSlop={16} style={[styles.thumb, { left: toX(high) - THUMB / 2 }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: CHART_H, position: 'relative' },
  track: { height: 1.5, backgroundColor: colors.border },
  activeTrack: { position: 'absolute', top: CHART_H, height: 1.5, backgroundColor: colors.ink },
  thumb: {
    position: 'absolute',
    top: CHART_H - THUMB / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
});
