import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

interface CategoryIconProps {
  /** Ionicons glyph name stored on the category. */
  icon: string;
  color: string;
  size?: number;
}

/** Returns a valid Ionicons name, falling back to a generic icon for unknown names. */
export function toIconName(icon: string): IconName {
  return icon in Ionicons.glyphMap ? (icon as IconName) : 'pricetag';
}

/** A category's icon inside a soft colored circle. */
export function CategoryIcon({ icon, color, size = 40 }: CategoryIconProps) {
  return (
    <View
      style={[
        styles.circle,
        // "22" is ~13% opacity in hex, giving a light tint of the category color.
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}22` },
      ]}>
      <Ionicons name={toIconName(icon)} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
