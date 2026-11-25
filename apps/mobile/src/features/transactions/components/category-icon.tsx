import { type IconName, type Ramp, rampColor, TintedIcon } from '@/components/ui/tinted-icon';

const STYLES: Record<string, [IconName, Ramp]> = {
  Mercado: ['cart', 'teal'],
  Transporte: ['bus', 'blue'],
  Arriendo: ['home', 'purple'],
  Servicios: ['flash', 'amber'],
  Salud: ['medkit', 'red'],
  Restaurantes: ['restaurant', 'coral'],
  Entretenimiento: ['film', 'pink'],
  Educación: ['school', 'blue'],
  Ropa: ['shirt', 'pink'],
  Deudas: ['card', 'red'],
  Salario: ['cash', 'teal'],
  'Trabajo extra': ['briefcase', 'teal'],
  Ventas: ['pricetag', 'green'],
  Regalos: ['gift', 'pink'],
};

const styleOf = (name?: string | null, income?: boolean): [IconName, Ramp] =>
  (name && STYLES[name]) || (income ? ['arrow-down', 'teal'] : ['pricetag', 'gray']);

type Props = { name?: string | null; income?: boolean; small?: boolean };

/**
 * Ícono de la categoría en un círculo de su color.
 * shortcut: va por el nombre de las categorías que trae la app; las nuevas o renombradas
 * usan el genérico. Si se quiere elegir ícono, guardar ícono y color en `categories`.
 */
export function CategoryIcon({ name, income, small }: Props) {
  const [icon, ramp] = styleOf(name, income);
  return <TintedIcon icon={icon} ramp={ramp} size={small ? 'sm' : 'md'} />;
}

/** El color de la categoría, para barras y leyendas. */
export const categoryColor = (name?: string | null) => rampColor(styleOf(name)[1]);
