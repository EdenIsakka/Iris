import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  useColorScheme,
} from 'react-native';
import { palette } from '@/lib/theme';

// Si la clase ya trae un color del tema, no se agrega text-label: dos colores a la vez
// dependen del orden en que Tailwind genera las clases, no del orden en el className.
const HAS_COLOR = new RegExp(`\\btext-(${Object.keys(palette.light).join('|')})\\b`);
const withLabel = (className = '') =>
  HAS_COLOR.test(className) ? className : `text-label ${className}`;

/** Text de React Native con el color del tema: el de RN es negro siempre, ilegible en oscuro. */
export function Text({ className, ...props }: TextProps) {
  return <RNText className={withLabel(className)} {...props} />;
}

/** TextInput con texto y placeholder del tema. */
export function TextInput({ className, ...props }: TextInputProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <RNTextInput
      className={withLabel(className)}
      placeholderTextColor={palette[scheme].secondary}
      {...props}
    />
  );
}
