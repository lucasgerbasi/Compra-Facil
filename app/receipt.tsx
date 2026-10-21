import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppData } from '@/lib/useAppData';
import { recognizeReceipt } from '@/lib/receiptOcr';
import type { Product } from '@/lib/types';

type Candidate = {
  id: string;
  name: string;
  quantity: string;
  selected: boolean;
};

const stamp = () => new Date().toISOString();
const makeId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });

// Words and phrases that usually identify receipt metadata.
const ignored =
  /\b(total|subtotal|sub-total|grand total|amount due|balance due|tax|sales tax|tip|gratuity|discount|change|cash|credit|debit|card|visa|mastercard|amex|payment|paid|thank you|thanks for shopping|receipt|cash receipt|invoice|address|adress|phone|tel|telephone|manager|server|waiter|waitress|table|check|guest count|guests|ordered|order number|receipt number|transaction|authorization|approval|date|time|cashier|operator|terminal|store number|store #|customer|customer copy|merchant|tax id|vat|gst|hst|fee|service charge|tip mem|fed tax|state tax|city tax|item|description|qty|quantity|unit price|sku|barcode|register|thank you for your visit|obrigad[oa]|volte sempre|cnpj|cpf|nota fiscal|consumidor|troco|dinheiro|cart[aã]o|pix|impostos|tributos|c[oó]digo|pagamento)\b/i;

const moneyOnly = /^[\d.,\sR$€£-]+$/i;

const addressOrLocation =
  /\b(st\.?|street|ave\.?|avenue|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|apt\.?|apartment|suite|ste\.?|postcode|postal code|zip code|city|state|province|embarcadero|highway|hwy\.?|floor|building|bldg\.?|san francisco|new york|los angeles|toronto|vancouver|london|paris)\b/i;

const locationOnly =
  /^(new york city|new york,? ny|new york|los angeles|san francisco|chicago|london|paris|toronto|vancouver|são paulo|sao paulo|rio de janeiro)$/i;

// Recognizes prices such as 14.90, 14,90, $98.00 and €12,50.
const amountAtEnd = /(?:[$€£]\s*)?\d{1,6}\s*[.,]\s*\d{2}\s*$/i;

function normalizeLine(line: string): string {
  return line.replace(/[|*_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isReceiptMetadata(original: string, cleaned: string): boolean {
  const raw = normalizeLine(original);
  const line = cleaned.toLocaleLowerCase('pt-BR');

  if (!raw || !line || ignored.test(raw) || ignored.test(line)) {
    return true;
  }

  if (moneyOnly.test(line) || locationOnly.test(line)) {
    return true;
  }

  // Reject common address and location patterns.
  if (addressOrLocation.test(raw)) {
    return true;
  }

  // Postal codes, including OCR confusion between CA and ÇA.
  if (/\b(?:CA|Ç[AÁ])\s*\d{5}(?:-\d{4})?\b/i.test(raw)) {
    return true;
  }

  // Dates and times.
  if (
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(raw) ||
    /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/i.test(raw)
  ) {
    return true;
  }

  // Standalone receipt numbers or IDs.
  if (/^(?:[#:]?\s*)?\d{3,}$/.test(line)) {
    return true;
  }

  // Payment card details.
  if (/\b(?:visa|mastercard|amex|xxxx|\*{3,})\b/i.test(raw)) {
    return true;
  }

  // Receipt field labels, e.g. "Server: Angie".
  if (/^[^$]{1,35}:/.test(raw)) {
    return true;
  }

  // Catch metadata labels even when OCR adds surrounding text.
  if (
    /\b(?:subtotal|grand total|total|tax|tip|server|manager|address|ordered|guest|check|receipt|thank|shopping)\b/i.test(
      raw,
    )
  ) {
    return true;
  }

  return false;
}

function parseReceiptLine(
  original: string,
): {
  name: string;
  quantity: string;
  hasPrice: boolean;
  hasLeadingQuantity: boolean;
} | null {
  const value = normalizeLine(original);

  if (!value) {
    return null;
  }

  // Capture a leading quantity, e.g. "2 RIB EYE $52.00".
  const quantityMatch = value.match(/^\s*(\d{1,3})\s*[xX]?\s+(.+)$/);
  const leadingNumber = quantityMatch ? Number(quantityMatch[1]) : null;

  let body = quantityMatch ? quantityMatch[2].trim() : value;
  const hasPrice = amountAtEnd.test(body);

  // Remove a trailing price, including OCR spacing like "$289 .00".
  body = body
    .replace(/\s+(?:[$€£]\s*)?\d{1,6}\s*[.,]\s*\d{2}\s*$/i, '')
    .trim();

  // Remove common trailing units when present.
  body = body
    .replace(/\s+\d+(?:[,.]\d+)?\s*(?:UN|UND|KG|G|L|ML|CX|PCT)\s*$/i, '')
    .trim();

  body = body
    .replace(/^[\s:;,.#-]+|[\s:;,.#-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Large leading numbers are more likely addresses or IDs than quantities.
  if (leadingNumber !== null && leadingNumber > 99 && !hasPrice) {
    return null;
  }

  const hasLeadingQuantity =
    leadingNumber !== null && leadingNumber >= 1 && leadingNumber <= 99;

  if (!body || body.length < 3 || body.length > 70) {
    return null;
  }

  if (!/[A-Za-zÀ-ÿ]{3}/.test(body)) {
    return null;
  }

  if (isReceiptMetadata(original, body)) {
    return null;
  }

  // Require positive evidence of an item:
  // a readable price or a leading quantity.
  // This rejects headers such as "EPIC STEAKHOUSE" and fragments like
  // "AU MNIOS", which have neither signal.
  if (!hasPrice && !hasLeadingQuantity) {
    return null;
  }

  // Preserve quantities when a price is readable.
  // If OCR produces a suspicious large quantity without a price, use 1
  // rather than accidentally adding many units to the inventory.
  const quantity =
    hasLeadingQuantity && (hasPrice || leadingNumber! <= 9)
      ? String(leadingNumber)
      : '1';

  return {
    name: body,
    quantity,
    hasPrice,
    hasLeadingQuantity,
  };
}

function candidatesFromText(raw: string): Candidate[] {
  const seen = new Set<string>();

  return raw
    .split(/\r?\n/)
    .map((original) => ({
      original,
      parsed: parseReceiptLine(original),
    }))
    .filter(
      (
        entry,
      ): entry is {
        original: string;
        parsed: NonNullable<ReturnType<typeof parseReceiptLine>>;
      } => entry.parsed !== null,
    )
    .filter(({ parsed }) => {
      const key = parsed.name
        .toLocaleLowerCase('pt-BR')
        .replace(/\s+/g, ' ');

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 40)
    .map(({ parsed }) => ({
      id: makeId(),
      name: parsed.name,
      quantity: parsed.quantity,
      selected: true,
    }));
}

export default function Receipt() {
  const router = useRouter();
  const { data, upsertProduct } = useAppData();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const selectedCount = useMemo(
    () => items.filter((item) => item.selected && item.name.trim()).length,
    [items],
  );

  async function chooseImage(camera: boolean) {
    try {
      setMessage('');

      const result = camera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
          });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const uri = result.assets[0].uri;

      setImageUri(uri);
      setBusy(true);

      try {
        const text = await recognizeReceipt(uri);

        setRawText(text);

        const found = candidatesFromText(text);
        setItems(found);

        setMessage(
          found.length
            ? `${found.length} possíveis itens reconhecidos. Confira antes de salvar.`
            : 'Não encontrei nomes de produtos com segurança. Você pode editar ou colar o texto abaixo.',
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível reconhecer o texto. Digite ou cole o texto do cupom abaixo.',
        );
      } finally {
        setBusy(false);
      }
    } catch {
      setMessage(
        'Não foi possível abrir a câmera/galeria. Confira as permissões e tente novamente.',
      );
    }
  }

  function useText() {
    const found = candidatesFromText(rawText);

    setItems(found);

    setMessage(
      found.length
        ? `${found.length} possíveis itens preparados. Confira os nomes e quantidades.`
        : 'Nenhum produto foi identificado. Tente colar o texto do cupom, uma linha por produto.',
    );
  }

  function updateItem(id: string, changes: Partial<Candidate>) {
    setItems((old) =>
      old.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  async function confirm() {
    const selected = items.filter(
      (item) => item.selected && item.name.trim(),
    );

    if (!selected.length) {
      setMessage('Selecione pelo menos um produto para atualizar o estoque.');
      return;
    }

    setBusy(true);

    try {
      for (const item of selected) {
        const quantity = Math.max(
          1,
          Math.floor(Number(item.quantity) || 1),
        );

        const existing = data.products.find(
          (product) =>
            product.name.trim().toLocaleLowerCase('pt-BR') ===
            item.name.trim().toLocaleLowerCase('pt-BR'),
        );

        if (existing) {
          await upsertProduct({
            ...existing,
            quantity: existing.quantity + quantity,
            updated_at: stamp(),
          });
        } else {
          const product: Product = {
            id: makeId(),
            name: item.name.trim(),
            quantity,
            minimum_quantity: 1,
            created_at: stamp(),
            updated_at: stamp(),
          };

          await upsertProduct(product);
        }
      }

      setMessage(
        `${selected.length} produto(s) confirmado(s) e estoque atualizado.`,
      );

      setItems([]);
      setRawText('');
      setImageUri(null);
    } catch {
      setMessage(
        'Houve um erro ao salvar. Confira a conexão e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.replace('/home')}>
        <Text style={s.back}>← Início</Text>
      </Pressable>

      <Text style={s.title}>Ler cupom fiscal</Text>

      <Text style={s.sub}>
        Fotografe o cupom, revise os produtos reconhecidos e só então atualize
        seu estoque.
      </Text>

      <View style={s.notice}>
        <Text style={s.noticeTitle}>Como funciona</Text>
        <Text style={s.noticeText}>
          1. Tire uma foto ou escolha uma imagem. 2. O OCR tenta ler o texto. 3.
          Confira nomes e quantidades. 4. Confirme para somar os itens ao
          estoque.
        </Text>
      </View>

      <View style={s.actions}>
        <Pressable style={s.primary} onPress={() => chooseImage(true)}>
          <Text style={s.primaryText}>Fotografar cupom</Text>
        </Pressable>

        <Pressable style={s.secondary} onPress={() => chooseImage(false)}>
          <Text style={s.secondaryText}>Escolher imagem</Text>
        </Pressable>
      </View>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={s.preview}
          resizeMode="contain"
        />
      )}

      {busy && (
        <View style={s.loading}>
          <ActivityIndicator />
          <Text style={s.muted}>Processando ou salvando...</Text>
        </View>
      )}

      {!!message && (
        <Text accessibilityRole="alert" style={s.message}>
          {message}
        </Text>
      )}

      <Text style={s.label}>Texto extraído ou texto do cupom</Text>

      <Text style={s.help}>
        O texto da imagem é reconhecido automaticamente. Na primeira leitura,
        aguarde o carregamento do OCR em português. Se necessário, corrija ou
        cole o texto aqui e toque em “Preparar produtos”.
      </Text>

      <TextInput
        style={s.textArea}
        value={rawText}
        onChangeText={setRawText}
        placeholder={'Ex.:\nARROZ 5KG 24,90\nLEITE INTEGRAL 4,99\nFEIJAO 8,50'}
        multiline
        textAlignVertical="top"
      />

      <Pressable style={s.secondary} onPress={useText}>
        <Text style={s.secondaryText}>
          Preparar produtos a partir do texto
        </Text>
      </Pressable>

      {items.length > 0 && (
        <>
          <Text style={s.section}>Revise antes de salvar</Text>

          <Text style={s.help}>
            Os nomes podem vir incorretos do cupom. Edite-os e ajuste as
            quantidades antes de confirmar.
          </Text>

          {items.map((item) => (
            <View style={s.item} key={item.id}>
              <Pressable
                style={[s.check, item.selected && s.checked]}
                onPress={() =>
                  updateItem(item.id, { selected: !item.selected })
                }
              >
                <Text style={item.selected ? s.checkText : undefined}>
                  {item.selected ? '✓' : ''}
                </Text>
              </Pressable>

              <View style={s.itemMain}>
                <TextInput
                  style={s.itemName}
                  value={item.name}
                  onChangeText={(name) => updateItem(item.id, { name })}
                />

                <Text style={s.help}>Quantidade a adicionar</Text>

                <TextInput
                  style={s.quantity}
                  value={item.quantity}
                  onChangeText={(quantity) =>
                    updateItem(item.id, { quantity })
                  }
                  keyboardType="number-pad"
                />

                {data.products.some(
                  (product) =>
                    product.name.trim().toLocaleLowerCase('pt-BR') ===
                    item.name.trim().toLocaleLowerCase('pt-BR'),
                ) && (
                  <Text style={s.match}>
                    Já existe no estoque; a quantidade será somada.
                  </Text>
                )}
              </View>
            </View>
          ))}

          <Pressable
            style={[s.primary, busy && s.disabled]}
            onPress={confirm}
            disabled={busy}
          >
            <Text style={s.primaryText}>
              Confirmar {selectedCount} produto(s)
            </Text>
          </Pressable>
        </>
      )}

      <Text style={s.footer}>
        O reconhecimento pode errar nomes ou quantidades. Revise sempre antes
        de confirmar.
      </Text>
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
    marginBottom: 20,
    lineHeight: 20,
  },
  notice: {
    backgroundColor: '#e9eee5',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  noticeTitle: {
    fontWeight: '900',
    marginBottom: 6,
    color: '#344331',
  },
  noticeText: {
    color: '#4f594b',
    lineHeight: 20,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  primary: {
    backgroundColor: '#20241f',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '900',
  },
  secondary: {
    backgroundColor: '#e9eee5',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryText: {
    color: '#4e674b',
    fontWeight: '900',
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 230,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  muted: {
    color: '#7b8077',
    fontSize: 12,
  },
  message: {
    color: '#4e674b',
    fontWeight: '700',
    marginVertical: 10,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 7,
  },
  help: {
    fontSize: 12,
    color: '#7b8077',
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 130,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
  },
  section: {
    fontSize: 20,
    fontWeight: '900',
    color: '#20241f',
    marginTop: 25,
    marginBottom: 6,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e5df',
    padding: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9aa193',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  checked: {
    backgroundColor: '#587052',
    borderColor: '#587052',
  },
  checkText: {
    color: '#fff',
    fontWeight: '900',
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    borderWidth: 1,
    borderColor: '#e4e5df',
    borderRadius: 8,
    padding: 10,
    fontWeight: '800',
    color: '#20241f',
  },
  quantity: {
    width: 90,
    borderWidth: 1,
    borderColor: '#e4e5df',
    borderRadius: 8,
    padding: 9,
    backgroundColor: '#fff',
  },
  match: {
    fontSize: 11,
    color: '#587052',
    marginTop: 5,
    fontWeight: '700',
  },
  footer: {
    fontSize: 11,
    color: '#858a81',
    lineHeight: 17,
    marginTop: 22,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});