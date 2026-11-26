import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  apiPath,
  defaultApiBase,
  generateHeadlines,
  headlineCounts,
  headlineStyles,
  topicLimit,
  type HeadlineOptions,
} from './api';
import { FocusButton } from './focus-button';
import { colors, styles } from './styles';
import { useWideLayout } from './use-wide-layout';

const apiBase = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || defaultApiBase;
const endpoint = Platform.OS === 'web' ? apiPath : apiBase + apiPath;

export function HeadlineScreen() {
  const wide = useWideLayout();
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<HeadlineOptions['style']>(headlineStyles[0]);
  const [count, setCount] = useState<HeadlineOptions['count']>(5);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [topicFocused, setTopicFocused] = useState(false);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<{ index: number; success: boolean }>();
  const activeRequest = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyAttempt = useRef(0);

  const canGenerate = topic.trim().length >= 2 && !isLoading;

  useEffect(() => () => {
    activeRequest.current?.abort();
    clearTimeout(copyTimer.current);
    copyAttempt.current += 1;
  }, []);

  async function generate() {
    if (!canGenerate || activeRequest.current) return;
    Keyboard.dismiss();
    const controller = new AbortController();
    activeRequest.current = controller;
    copyAttempt.current += 1;
    clearTimeout(copyTimer.current);
    setCopyFeedback(undefined);
    setHeadlines([]);
    setError('');
    setIsLoading(true);

    const timeout = setTimeout(() => {
      controller.abort();
      setError('Запрос занял слишком много времени. Попробуйте ещё раз.');
    }, 50_000);
    try {
      const results = await generateHeadlines(endpoint, { topic: topic.trim(), style, count }, controller.signal);
      if (!controller.signal.aborted) setHeadlines(results);
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setError(requestError instanceof Error ? requestError.message : 'Не удалось сгенерировать заголовки.');
      }
    } finally {
      clearTimeout(timeout);
      activeRequest.current = null;
      setIsLoading(false);
    }
  }

  async function copyHeadline(headline: string, index: number) {
    const attempt = ++copyAttempt.current;
    const success = await Clipboard.setStringAsync(headline).catch(() => false);
    if (attempt !== copyAttempt.current) return;
    clearTimeout(copyTimer.current);
    setCopyFeedback({ index, success });
    copyTimer.current = setTimeout(() => setCopyFeedback(undefined), 1600);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={[styles.shell, wide && styles.wideShell]}>
            <View style={styles.topbar}>
              <View style={styles.brand}>
                <View style={styles.brandMark}><Text style={styles.brandSpark}>✦</Text></View>
                <Text style={styles.brandName}>искра<Text style={styles.accent}>.</Text></Text>
              </View>
              <Text style={styles.note}>Мастерская заголовков</Text>
            </View>

            <View style={[styles.hero, wide && styles.wideHero]}>
              <View style={styles.eyebrow}>
                <View style={styles.eyebrowLine} />
                <Text style={styles.kicker}>ИДЕИ, КОТОРЫЕ ЦЕПЛЯЮТ</Text>
              </View>
              <Text accessibilityRole="header" style={[styles.heroTitle, wide && styles.wideTitle]}>
                Хорошая история{ '\n' }<Text style={styles.accent}>начинается с заголовка.</Text>
              </Text>
              <Text style={styles.heroCopy}>
                Поделитесь темой — и получите идеи, мимо которых невозможно пролистнуть.
              </Text>
            </View>

            <View style={[styles.section, styles.form]}>
              <Text style={styles.label}>О чём ваша статья?</Text>
              <View style={[styles.topicField, topicFocused && styles.focusedField]}>
                <Text style={styles.topicSpark}>✧</Text>
                <TextInput
                  accessibilityLabel="О чём ваша статья?"
                  value={topic}
                  onChangeText={setTopic}
                  onFocus={() => setTopicFocused(true)}
                  onBlur={() => setTopicFocused(false)}
                  onSubmitEditing={generate}
                  returnKeyType="go"
                  maxLength={topicLimit}
                  placeholder="Например, как ИИ меняет образование"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
                <Text style={styles.counter}>{topic.length}/{topicLimit}</Text>
              </View>

              <View style={[styles.formBottom, wide && styles.wideFormBottom]}>
                <View style={styles.options}>
                  <FocusButton
                    accessibilityRole="button"
                    accessibilityLabel={`Стиль заголовков, ${style}`}
                    onPress={() => {
                      Keyboard.dismiss();
                      setStylePickerOpen(true);
                    }}
                    style={({ pressed }) => [styles.select, pressed && styles.pressed]}>
                    <Text style={styles.optionText}>{style} <Text style={styles.accent}>⌄</Text></Text>
                  </FocusButton>
                  <View style={styles.countOptions} accessibilityRole="radiogroup" accessibilityLabel="Количество вариантов">
                    <Text style={styles.countLabel}>Вариантов</Text>
                    {headlineCounts.map((value) => (
                      <FocusButton
                        key={value}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: value === count }}
                        accessibilityLabel={String(value)}
                        onPress={() => setCount(value)}
                        style={[styles.countButton, value === count && styles.selected]}>
                        <Text style={[styles.optionText, value === count && styles.accent]}>{value}</Text>
                      </FocusButton>
                    ))}
                  </View>
                </View>
                <FocusButton
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canGenerate, busy: isLoading }}
                  disabled={!canGenerate}
                  onPress={generate}
                  style={({ pressed }) => [styles.primary, !canGenerate && styles.disabled, pressed && styles.pressed]}>
                  <Text style={styles.primaryText}>
                    {isLoading ? '✦  Ищем идеи…' : '✦  Придумать заголовки  ↗'}
                  </Text>
                </FocusButton>
              </View>
            </View>

            <Text style={styles.hint}><Text style={styles.accent}>✳  </Text>Чем точнее тема, тем интереснее результат</Text>

            {isLoading ? (
              <View style={styles.status} accessibilityLiveRegion="polite">
                <ActivityIndicator color={colors.orange} size="large" />
                <Text style={styles.statusTitle}>Подбираем точные слова…</Text>
                <Text style={styles.note}>Сейчас появятся свежие идеи</Text>
              </View>
            ) : error ? (
              <View style={styles.status}>
                <View style={styles.ornament}><Text style={styles.accent}>!</Text></View>
                <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text>
                <FocusButton accessibilityRole="button" disabled={!canGenerate} onPress={generate} style={[styles.secondary, !canGenerate && styles.disabled]}>
                  <Text style={styles.secondaryText}>Повторить</Text>
                </FocusButton>
              </View>
            ) : headlines.length ? (
              <View style={[styles.section, styles.results]} accessibilityLiveRegion="polite">
                <View style={styles.resultsHeading}>
                  <View style={styles.resultTitle}>
                    <Text style={styles.kicker}>ВАШИ ИДЕИ</Text>
                    <Text accessibilityRole="header" style={styles.resultsTitle}>
                      Есть за что зацепиться<Text style={styles.accent}>.</Text>
                    </Text>
                  </View>
                  <Text style={styles.resultsCount}>{headlines.length} вариантов</Text>
                </View>
                {headlines.map((headline, index) => (
                  <View key={index} style={styles.headlineCard}>
                    <Text style={styles.headlineNumber}>{String(index + 1).padStart(2, '0')}</Text>
                    <View style={[styles.headlineBody, wide && styles.wideHeadlineBody]}>
                      <Text selectable style={styles.headline}>{headline}</Text>
                      <FocusButton
                        accessibilityRole="button"
                        accessibilityLabel={`Скопировать заголовок ${index + 1}`}
                        onPress={() => copyHeadline(headline, index)}
                        style={styles.copyButton}>
                        <Text accessibilityLiveRegion="polite" style={styles.secondaryText}>
                          {copyFeedback?.index === index
                            ? copyFeedback.success ? 'Готово ✓' : 'Не удалось скопировать'
                            : 'Копировать'}
                        </Text>
                      </FocusButton>
                    </View>
                  </View>
                ))}
                <FocusButton accessibilityRole="button" disabled={!canGenerate} onPress={generate} style={[styles.secondary, !canGenerate && styles.disabled]}>
                  <Text style={styles.secondaryText}>✧  Попробовать ещё</Text>
                </FocusButton>
              </View>
            ) : (
              <View style={styles.status}>
                <View style={styles.ornament}><Text style={styles.ornamentSpark}>✳</Text></View>
                <Text style={styles.statusTitle}>Здесь появятся ваши будущие хиты</Text>
                <Text style={styles.note}>Начните с темы выше — остальное за нами</Text>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Искра <Text style={styles.accent}>✳</Text> Заголовки с характером</Text>
              <Text style={styles.footerText}>Сделано для хороших историй</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal supportedOrientations={['portrait', 'landscape']} animationType="fade" transparent visible={stylePickerOpen} onRequestClose={() => setStylePickerOpen(false)}>
        <View style={styles.modal}>
          <Pressable focusable={false} accessible={false} style={styles.backdrop} onPress={() => setStylePickerOpen(false)} />
          <View accessibilityViewIsModal style={styles.dialog}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.dialogContent}>
              <Text accessibilityRole="header" style={styles.dialogTitle}>Стиль заголовков</Text>
              {headlineStyles.map((item) => (
                <FocusButton
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: style === item }}
                  style={[styles.styleOption, style === item && styles.selected]}
                  onPress={() => {
                    setStyle(item);
                    setStylePickerOpen(false);
                  }}>
                  <Text style={styles.optionText}>{item}</Text>
                  {style === item && <Text style={styles.accent}>✓</Text>}
                </FocusButton>
              ))}
              <FocusButton accessibilityRole="button" onPress={() => setStylePickerOpen(false)} style={styles.secondary}>
                <Text style={styles.secondaryText}>Отмена</Text>
              </FocusButton>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
