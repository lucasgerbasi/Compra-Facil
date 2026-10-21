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
import type { Product } from '@/lib/types';

const id = () => Date.now() + '-' + Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();

export default function Product() {
  const r = useRouter();
  const { upsertProduct } = useAppData();
  const [n, setN] = useState('');
  const [q, setQ] = useState('0');
  const [m, setM] = useState('1');

  async function save() {
    if (!n.trim()) return;
    
    await upsertProduct({
      id: id(),
      name: n.trim(),
      quantity: Math.max(0, +q || 0),
      minimum_quantity: Math.max(0, +m || 0),
      created_at: now(),
      updated_at: now(),
    });
    
    r.replace('/inventory');
  }

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Pressable onPress={() => r.replace('/inventory')}>
        <Text style={s.back}>← Estoque</Text>
      </Pressable>
      
      <Text style={s.title}>Novo produto</Text>
      <Text style={s.sub}>Cadastre algo que você costuma ter em casa.</Text>
      
      <Text style={s.label}>Nome</Text>
      <TextInput
        style={s.input}
        value={n}
        onChangeText={setN}
        placeholder="Ex.: café"
      />
      
      <Text style={s.label}>Quantidade atual</Text>
      <TextInput
        style={s.input}
        value={q}
        onChangeText={setQ}
        keyboardType="number-pad"
      />
      
      <Text style={s.label}>Considerar baixo estoque em</Text>
      <TextInput
        style={s.input}
        value={m}
        onChangeText={setM}
        keyboardType="number-pad"
      />
      <Text style={s.help}>
        O produto aparecerá como acabando quando chegar neste número.
      </Text>
      
      <Pressable style={s.save} onPress={save}>
        <Text style={s.st}>Salvar produto</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {
    padding: 24,
    paddingTop: 48,
    maxWidth: 600,
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
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 15,
    marginBottom: 7,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  help: {
    fontSize: 12,
    color: '#7b8077',
    lineHeight: 18,
    marginTop: 8,
  },
  save: {
    height: 52,
    backgroundColor: '#20241f',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  st: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});