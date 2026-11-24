import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Tonos medios: el ícono blanco se lee encima tanto en tema claro como oscuro.
const STYLES: Record<string, [IconName, string]> = {
  Mercado: ['cart', '#1D9E75'],
  Transporte: ['bus', '#378ADD'],
  Arriendo: ['home', '#7F77DD'],
  Servicios: ['flash', '#BA7517'],
  Salud: ['medkit', '#E24B4A'],
  Restaurantes: ['restaurant', '#D85A30'],
  Entretenimiento: ['film', '#D4537E'],
  Educación: ['school', '#534AB7'],
  Ropa: ['shirt', '#993556'],
  Deudas: ['card', '#A32D2D'],
  Salario: ['cash', '#0F6E56'],
  'Trabajo extra': ['briefcase', '#1D9E75'],
  Ventas: ['pricetag', '#639922'],
  Regalos: ['gift', '#D4537E'],
};

/**
 * Círculo de color con el ícono de la categoría.
 * shortcut: va por el nombre de las categorías que trae la app; las nuevas o renombradas
 * usan el genérico. Si se quiere elegir ícono, guardar ícono y color en `categories`.
 */
export function CategoryIcon({ name, income }: { name?: string | null; income?: boolean }) {
  const [icon, color] = (name && STYLES[name]) || [
    income ? 'arrow-down' : 'pricetag',
    income ? '#0F6E56' : '#888780',
  ];
  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: color }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
    </View>
  );
}

/** El color de la categoría, para barras y leyendas. */
export const categoryColor = (name?: string | null) => (name && STYLES[name]?.[1]) || '#888780';
