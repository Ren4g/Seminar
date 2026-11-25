/**
 * @file LanguageVoicesPanel.tsx
 * @description Màn hình "Ngôn ngữ & giọng đọc": Tích hợp Form tạo ngôn ngữ mới và Bảng quản lý ngôn ngữ & giọng đọc ElevenLabs.
 * @screen Tab "Ngôn ngữ & giọng đọc" trong trang quản trị Admin.
 * @activityDiagram Bước "Cấu hình ngôn ngữ hệ thống" -> "Gán giọng đọc AI ElevenLabs".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Form tạo ngôn ngữ: Thẻ `<LanguageCreateForm />`.
 *  - Bảng ngôn ngữ & voices: Thẻ `<LanguageTable />`.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { api, type ApiLanguage, type ApiVoice } from '../../api';
import { PRESET_LANGUAGES } from '../../constants/languages';
import { LanguageCreateForm } from './LanguageCreateForm';
import { LanguageTable } from './LanguageTable';

type LanguageVoicesPanelProps = {
  token: string;
  onToast: (message: string) => void;
  onLanguagesChange?: (languages: ApiLanguage[]) => void;
  onVoicesChange?: (voices: ApiVoice[]) => void;
};

// [TÍNH NĂNG: Khung điều phối Quản lý Ngôn ngữ và Giọng đọc]
export function LanguageVoicesPanel({
  token,
  onToast,
  onLanguagesChange,
  onVoicesChange,
}: LanguageVoicesPanelProps) {
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [voices, setVoices] = useState<ApiVoice[]>([]);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: 'ja',
    name: 'Tiếng Nhật (Japanese)',
    voice: 'ErXwobaYiN019PkySvjV',
  });

  const reload = async () => {
    const [nextLanguages, nextVoices] = await Promise.all([api.languages(token), api.voices(token)]);
    setLanguages(nextLanguages);
    setVoices(nextVoices);
    onLanguagesChange?.(nextLanguages);
    onVoicesChange?.(nextVoices);
  };

  useEffect(() => {
    void reload().catch((error: unknown) =>
      onToast(error instanceof Error ? error.message : 'Không thể tải dữ liệu')
    );
  }, []);

  // [TÍNH NĂNG: Bật hoặc tắt trạng thái hoạt động của ngôn ngữ]
  const toggleLanguage = async (item: ApiLanguage) => {
    if (item.isFallback || item.code.toLowerCase() === 'en') {
      const msg = 'Không thể tắt ngôn ngữ mặc định (tiếng Anh / Fallback).';
      onToast(msg);
      window.alert(msg);
      return;
    }
    if (item.isActive) {
      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn tắt ngôn ngữ "${item.name}" (${item.code.toUpperCase()})?\n\nCảnh báo: Khách tham quan sẽ không thể tiếp cận các bài thuyết minh thuộc ngôn ngữ này trên trang web.`
      );
      if (!confirmed) return;
    }
    try {
      await api.setLanguageActive(token, item.code, !item.isActive);
      await reload();
      onToast(item.isActive ? `Đã tắt ngôn ngữ ${item.code.toUpperCase()}.` : `Đã kích hoạt ngôn ngữ ${item.code.toUpperCase()}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái ngôn ngữ';
      onToast(msg);
      window.alert(msg);
    }
  };

  // [TÍNH NĂNG: Đặt giọng đọc làm mặc định cho ngôn ngữ]
  const setDefaultVoice = async (langCode: string, voiceId: number) => {
    try {
      await api.setDefaultVoice(token, langCode, voiceId);
      await reload();
      onToast(`Đã chọn Voice #${voiceId} làm mặc định.`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật voice mặc định');
    }
  };

  // [TÍNH NĂNG: Xóa một voice khỏi danh sách]
  const deleteVoice = async (id: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Voice #${id}?`)) return;
    try {
      await api.deleteVoice(token, id);
      await reload();
      onToast(`Đã xóa Voice #${id}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể xóa voice';
      onToast(msg);
      window.alert(msg);
    }
  };

  // [TÍNH NĂNG: Thêm ngôn ngữ và tạo giọng đọc mới]
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const langCode = form.code.trim().toLowerCase();
      let existingLang = languages.find((l) => l.code.toLowerCase() === langCode);
      if (!existingLang && form.name.trim()) {
        existingLang = await api.createLanguage(token, langCode, form.name.trim());
      }
      if (form.voice.trim()) {
        const createdVoice = await api.createVoice(token, langCode, form.voice.trim());
        if (!existingLang?.defaultVoiceId && createdVoice?.id) {
          await api.setDefaultVoice(token, langCode, createdVoice.id).catch(() => undefined);
        }
      }
      await reload();
      const nextPreset = PRESET_LANGUAGES.find((p) => p.code !== form.code) ?? PRESET_LANGUAGES[0];
      setForm({ code: nextPreset.code, name: nextPreset.name, voice: nextPreset.defaultVoice });
      onToast('Đã lưu thay đổi.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể lưu');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="catalog-panel">
      <div className="catalog-heading">
        <div>
          <h2>Ngôn ngữ và giọng đọc.</h2>
        </div>
        <span className="catalog-count">{languages.length} ngôn ngữ · {voices.length} voice</span>
      </div>

      <LanguageCreateForm
        form={form}
        busy={busy}
        onChange={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
        onSubmit={submit}
      />

      <LanguageTable
        languages={languages}
        voices={voices}
        expandedLang={expandedLang}
        onToggleExpand={(code) => setExpandedLang(expandedLang === code ? null : code)}
        onToggleLanguage={toggleLanguage}
        onSetDefaultVoice={setDefaultVoice}
        onDeleteVoice={deleteVoice}
      />
    </section>
  );
}
