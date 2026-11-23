import { useEffect, useState } from 'react';
import { AppState, Linking, Share, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button, Form } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { bankNotifications } from '../../../../modules/bank-notifications';

const LISTENER_SETTINGS = 'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS';

const read = () => ({
  enabled: bankNotifications?.isEnabled() ?? false,
  items: bankNotifications?.all() ?? [],
});

/**
 * Prueba: activa el permiso y muestra lo que Iris guardó de los bancos, para escribir el lector
 * con el texto real. Todavía no crea movimientos.
 */
export function BankCapture() {
  const [state, setState] = useState(read);
  // Al volver de Ajustes se revisa otra vez el permiso y lo que llegó.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setState(read()));
    return () => sub.remove();
  }, []);

  const bank = bankNotifications;
  if (!bank) {
    return (
      <Text className="p-4">Esto solo funciona en la app instalada en Android, no en Expo Go.</Text>
    );
  }

  if (!state.enabled) {
    return (
      <Form>
        <Text className="text-[15px]">
          Para que Iris lea las notificaciones de tu banco (BBVA, o los SMS de Bancolombia):
        </Text>
        <Text className="mt-2 text-[15px]">
          1. Toca «Activar acceso» y busca Iris. Si Android dice que es una configuración
          restringida, vuelve aquí.
        </Text>
        <Text className="text-[15px]">
          2. Toca «Abrir información de Iris», luego ⋮ arriba a la derecha y «Permitir configuración
          restringida».
        </Text>
        <Text className="text-[15px]">3. Toca otra vez «Activar acceso» y activa Iris.</Text>
        <Button label="Activar acceso" onPress={() => Linking.sendIntent(LISTENER_SETTINGS)} />
        <Button destructive label="Abrir información de Iris" onPress={Linking.openSettings} />
        <Text className="mt-4 text-[13px] text-secondary">
          Iris solo guarda las notificaciones de bancos, y no salen de tu celular.
        </Text>
      </Form>
    );
  }

  const share = () =>
    Share.share({
      message: state.items
        .map((n) => `[${n.package}] ${n.title}\n${n.text}\n${new Date(n.postedAt).toISOString()}`)
        .join('\n\n'),
    });
  const clear = () => {
    bank.remove(state.items.map((n) => n.id));
    setState(read());
  };

  return (
    <Form>
      <Text className="text-[15px] text-secondary">
        Acceso activado. Estas son las notificaciones de bancos que guardó Iris; todavía no se
        vuelven movimientos.
      </Text>
      {state.items.length ? (
        state.items.map((n) => (
          <Card key={n.id} title={`${n.title} · ${new Date(n.postedAt).toLocaleString('es-CO')}`}>
            <Text className="text-[15px]">{n.text}</Text>
            <Text className="text-[13px] text-secondary">{n.package}</Text>
          </Card>
        ))
      ) : (
        <Text className="py-4 text-center text-secondary">
          Aún no ha llegado ninguna. Haz una compra o una transferencia y vuelve.
        </Text>
      )}
      {state.items.length ? (
        <View>
          <Button label="Compartir" onPress={share} />
          <Button destructive label="Borrar" onPress={clear} />
        </View>
      ) : null}
    </Form>
  );
}
