import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { colors, fonts, radius } from './theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
  filled?: boolean;
}

export const Field = forwardRef<TextInput, Props>(function Field({ label, error, trailing, leading, filled, style, ...rest }, ref) {
  return (
    <View style={{ gap: 8 }}>
      {label && <Text variant="title">{label}</Text>}
      <View style={[styles.box, filled && styles.filled, !!error && { borderColor: colors.danger }, rest.multiline && { height: 96, alignItems: 'flex-start', paddingTop: 12 }]}>
        {leading}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.faint}
          style={[styles.input, rest.multiline && { textAlignVertical: 'top', height: '100%' }, style]}
          {...rest}
        />
        {trailing}
      </View>
      {!!error && (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    height: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
  },
  filled: { backgroundColor: colors.surface, borderColor: colors.surface },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 },
});
