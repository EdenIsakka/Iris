import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { View } from 'react-native';
import { formatDate } from '@/lib/format-date';
import { Chip } from './chip';
import { FieldLabel } from './form';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const isSameDay = (date: Date, nDaysAgo: number) =>
  date.toDateString() === daysAgo(nDaysAgo).toDateString();

type Props = { value: Date; onChange: (date: Date) => void };

/** Fecha con atajos: Hoy, Ayer u otra del calendario (nunca futura). */
export function DateField({ value, onChange }: Props) {
  const [picking, setPicking] = useState(false);
  const otherDay = !isSameDay(value, 0) && !isSameDay(value, 1);
  return (
    <>
      <FieldLabel>Fecha</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Hoy" selected={isSameDay(value, 0)} onPress={() => onChange(daysAgo(0))} />
        <Chip label="Ayer" selected={isSameDay(value, 1)} onPress={() => onChange(daysAgo(1))} />
        <Chip
          label={otherDay ? formatDate(value) : 'Otra fecha'}
          selected={otherDay}
          onPress={() => setPicking(true)}
        />
      </View>
      {picking ? (
        <DateTimePicker
          value={value}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, picked) => {
            setPicking(false);
            if (event.type === 'set' && picked) onChange(picked);
          }}
        />
      ) : null}
    </>
  );
}
