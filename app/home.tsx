import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppData } from '@/lib/useAppData';

export default function Home() {
  const r = useRouter();
  const { data, ready, syncing } = useAppData();

  if (!ready) {
    return (
      <View style={s.center}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  const pending = data.shopping.filter((x) => !x.completed);
  const low = data.products.filter((x) => x.quantity <= x.minimum_quantity);

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.head}>
        <View>
          <Text style={s.brand}>COMPRA FÁCIL</Text>
          <Text style={s.title}>O que falta em casa?</Text>
        </View>
        <Text style={s.status}>{syncing ? '● sincronizando' : '● pronto'}</Text>
      </View>

      <View style={s.hero}>
        <Text style={s.heroN}>{pending.length}</Text>
        <View>
          <Text style={s.heroT}>itens para comprar</Text>
          <Text style={s.heroS}>sua próxima compra começa aqui.</Text>
        </View>
      </View>

      <View style={s.row}>
        <Text style={s.section}>Lista de compras</Text>
        <Pressable onPress={() => r.push('/shopping')}>
          <Text style={s.link}>Abrir</Text>
        </Pressable>
      </View>

      {pending.slice(0, 3).map((x) => (
        <View style={s.card} key={x.id}>
          <Text style={s.name}>{x.name}</Text>
          <Text style={s.qty}>× {x.quantity}</Text>
        </View>
      ))}

      {pending.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyBig}>Tudo comprado.</Text>
          <Text style={s.muted}>Adicione algo quando precisar.</Text>
        </View>
      )}

      <View style={s.row}>
        <Text style={s.section}>Acabando</Text>
        <Pressable onPress={() => r.push('/inventory')}>
          <Text style={s.link}>Estoque</Text>
        </Pressable>
      </View>

      {low.slice(0, 3).map((x) => (
        <View style={s.card} key={x.id}>
          <View>
            <Text style={s.name}>{x.name}</Text>
            <Text style={s.muted}>Mínimo: {x.minimum_quantity}</Text>
          </View>
          <Text style={s.low}>{x.quantity}</Text>
        </View>
      ))}

      <View style={s.buttons}>
        <Pressable style={s.button} onPress={() => r.push('/shopping')}>
          <Text style={s.bt}>Compras</Text>
        </Pressable>
        <Pressable style={s.button} onPress={() => r.push('/inventory')}>
          <Text style={s.bt}>Estoque</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {
    padding: 24,
    paddingTop: 50,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#f6f6f2',
    minHeight: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  brand: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#61705c',
  },
  title: {
    fontSize: 29,
    fontWeight: '900',
    color: '#20241f',
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    color: '#657160',
  },
  hero: {
    backgroundColor: '#20241f',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 27,
  },
  heroN: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
  },
  heroT: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  heroS: {
    fontSize: 12,
    color: '#cdd0c8',
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 3,
  },
  section: {
    fontSize: 18,
    fontWeight: '900',
    color: '#20241f',
  },
  link: {
    fontWeight: '800',
    color: '#587052',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e4e5df',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '750',
    color: '#252823',
  },
  qty: {
    fontWeight: '900',
    fontSize: 16,
  },
  muted: {
    fontSize: 12,
    color: '#7b8077',
    marginTop: 3,
  },
  low: {
    fontSize: 22,
    fontWeight: '900',
    color: '#a66a25',
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
  },
  emptyBig: {
    fontWeight: '800',
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#e9eee5',
    padding: 17,
    borderRadius: 14,
  },
  bicon: {
    fontSize: 22,
    marginBottom: 8,
  },
  bt: {
    fontWeight: '900',
  },
  future: {
    textAlign: 'center',
    fontSize: 12,
    color: '#858a81',
    lineHeight: 18,
    marginTop: 25,
    paddingBottom: 15,
  },
});