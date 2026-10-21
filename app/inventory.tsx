import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppData } from '@/lib/useAppData';

export default function Inventory() {
  const r = useRouter();
  const { data, upsertProduct, removeProduct } = useAppData();

  async function change(id: string, d: number) {
    const p = data.products.find((x) => x.id === id);
    if (p) {
      await upsertProduct({
        ...p,
        quantity: Math.max(0, p.quantity + d),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Pressable onPress={() => r.replace('/home')}>
        <Text style={s.back}>← Início</Text>
      </Pressable>

      <View style={s.head}>
        <View>
          <Text style={s.title}>Estoque</Text>
          <Text style={s.sub}>O que você já tem em casa.</Text>
        </View>
        <Pressable style={s.add} onPress={() => r.push('/product')}>
          <Text style={s.addt}>+ Produto</Text>
        </Pressable>
      </View>

      {data.products.map((p) => (
        <View style={s.card} key={p.id}>
          <View style={s.info}>
            <Text style={s.name}>{p.name}</Text>
            <Text style={s.muted}>Mínimo: {p.minimum_quantity}</Text>
            {p.quantity <= p.minimum_quantity && (
              <Text style={s.warn}>⚠️ Acabando</Text>
            )}
          </View>
          
          <View style={s.controls}>
            <Pressable style={s.circle} onPress={() => change(p.id, -1)}>
              <Text>−</Text>
            </Pressable>
            <Text style={s.number}>{p.quantity}</Text>
            <Pressable style={s.circle} onPress={() => change(p.id, 1)}>
              <Text>＋</Text>
            </Pressable>
          </View>
          
          <Pressable onPress={() => removeProduct(p.id)}>
            <Text style={s.del}>Excluir</Text>
          </Pressable>
        </View>
      ))}

      {!data.products.length && (
        <View style={s.empty}>
          <Text style={s.et}>Estoque vazio</Text>
          <Text style={s.muted}>Cadastre produtos que você costuma comprar.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {
    padding: 24,
    paddingTop: 48,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#f6f6f2',
    minHeight: '100%',
  },
  back: {
    fontWeight: '800',
    color: '#587052',
    marginBottom: 22,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#20241f',
  },
  sub: {
    color: '#7b8077',
    marginTop: 5,
  },
  add: {
    backgroundColor: '#20241f',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  addt: {
    color: '#fff',
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e5df',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  muted: {
    fontSize: 12,
    color: '#858a81',
    marginTop: 3,
  },
  warn: {
    fontSize: 12,
    color: '#a66a25',
    fontWeight: '800',
    marginTop: 5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginRight: 13,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6d9d1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 18,
    fontWeight: '900',
    minWidth: 22,
    textAlign: 'center',
  },
  del: {
    fontSize: 12,
    color: '#a24f46',
    fontWeight: '800',
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
  },
  et: {
    fontWeight: '900',
    fontSize: 17,
  },
});