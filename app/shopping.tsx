import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppData } from '@/lib/useAppData';
import type { ShoppingItem } from '@/lib/types';

const stamp = () => new Date().toISOString();
const id = () => Date.now() + '-' + Math.random().toString(36).slice(2);

export default function Shopping() {
  const r = useRouter();
  const { data, upsertShopping, removeShopping } = useAppData();
  const [name, setName] = useState('');
  const [q, setQ] = useState('1');

  async function add() {
    if (!name.trim()) return;
    
    await upsertShopping({
      id: id(),
      product_id: null,
      name: name.trim(),
      quantity: Math.max(1, +q || 1),
      completed: false,
      created_at: stamp(),
      updated_at: stamp(),
    });
    
    setName('');
    setQ('1');
  }

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Pressable onPress={() => r.replace('/home')}>
        <Text style={s.back}>← Início</Text>
      </Pressable>
      
      <Text style={s.title}>Lista de compras</Text>
      <Text style={s.sub}>Adicione o que precisa comprar.</Text>
      
      <View style={s.addrow}>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex.: café"
          onSubmitEditing={add}
        />
        <TextInput
          style={s.q}
          value={q}
          onChangeText={setQ}
          keyboardType="number-pad"
        />
        <Pressable style={s.add} onPress={add}>
          <Text style={s.addt}>Adicionar</Text>
        </Pressable>
      </View>
      
      {data.shopping.map((x) => (
        <View style={s.item} key={x.id}>
          <Pressable
            style={s.check}
            onPress={() =>
              upsertShopping({ ...x, completed: !x.completed, updated_at: stamp() })
            }
          >
            <Text>{x.completed ? '✓' : ''}</Text>
          </Pressable>
          <View style={s.main}>
            <Text style={[s.name, x.completed && s.strike]}>{x.name}</Text>
            <Text style={s.muted}>Quantidade: {x.quantity}</Text>
          </View>
          <Pressable onPress={() => removeShopping(x.id)}>
            <Text style={s.del}>Excluir</Text>
          </Pressable>
        </View>
      ))}
      
      {!data.shopping.length && (
        <View style={s.empty}>
          <Text style={s.et}>Lista vazia</Text>
          <Text style={s.muted}>Quando lembrar de algo, adicione aqui.</Text>
        </View>
      )}
      
      <Pressable style={s.secondary} onPress={() => r.push('/inventory')}>
        <Text style={s.st}>Atualizar estoque →</Text>
      </Pressable>
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
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#20241f',
  },
  sub: {
    color: '#7b8077',
    marginTop: 5,
    marginBottom: 22,
  },
  addrow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  q: {
    width: 52,
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    textAlign: 'center',
  },
  add: {
    backgroundColor: '#20241f',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addt: {
    color: '#fff',
    fontWeight: '900',
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e5df',
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8b9385',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  main: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  muted: {
    fontSize: 12,
    color: '#858a81',
    marginTop: 3,
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
  secondary: {
    marginTop: 18,
    backgroundColor: '#e9eee5',
    padding: 16,
    borderRadius: 13,
    alignItems: 'center',
  },
  st: {
    fontWeight: '900',
    color: '#4e674b',
  },
});