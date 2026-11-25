/**
 * @file LanguageTable.tsx
 * @description Bảng danh sách các ngôn ngữ: Mã, Tên, Trạng thái (Bật/Tắt), và Accordion xem/quản lý danh sách voice ElevenLabs tương ứng.
 * @screen Nằm dưới form tạo trong Tab "Ngôn ngữ & giọng đọc".
 * @activityDiagram Bước "Bật/tắt ngôn ngữ hiển thị cho khách" -> "Quản lý giọng đọc ElevenLabs".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút Bật/Tắt ngôn ngữ: Gọi `onToggleLanguage(item)`.
 *  - Đặt làm voice mặc định: Gọi `onSetDefaultVoice(item.code, voice.id)`.
 *  - Xóa voice: Gọi `onDeleteVoice(voice.id)`.
 */

import type { ApiLanguage, ApiVoice } from '../../api';

type LanguageTableProps = {
  languages: ApiLanguage[];
  voices: ApiVoice[];
  expandedLang: string | null;
  onToggleExpand: (code: string) => void;
  onToggleLanguage: (item: ApiLanguage) => void;
  onSetDefaultVoice: (langCode: string, voiceId: number) => void;
  onDeleteVoice: (voiceId: number) => void;
};

// [TÍNH NĂNG: Bảng danh sách ngôn ngữ và danh sách giọng đọc con]
export function LanguageTable({
  languages,
  voices,
  expandedLang,
  onToggleExpand,
  onToggleLanguage,
  onSetDefaultVoice,
  onDeleteVoice,
}: LanguageTableProps) {
  return (
    <div className="crud-table">
      {languages.map((item) => {
        const langVoices = voices.filter((v) => v.languageCode === item.code);
        const isExpanded = expandedLang === item.code;
        return (
          <div key={item.code} style={{ display: 'contents' }}>
            <div className="crud-row">
              <strong>
                {item.code.toUpperCase()}
                {item.isFallback ? ' (Mặc định)' : ''}
              </strong>
              <span>{item.name}</span>
              <span className={`status status--${item.isActive ? 'published' : 'draft'}`}>
                {item.isActive ? 'Hoạt động' : 'Tạm tắt'}
              </span>
              <button
                type="button"
                className="quiet-button"
                title={item.isFallback || item.code.toLowerCase() === 'en' ? 'Không thể tắt ngôn ngữ mặc định' : undefined}
                onClick={() => onToggleLanguage(item)}
              >
                {item.isActive ? 'Tắt' : 'Bật'}
              </button>
              <button
                type="button"
                className="quiet-button"
                style={isExpanded ? { background: 'var(--cream)', fontWeight: 600 } : {}}
                title="Xem và quản lý các giọng đọc của ngôn ngữ này"
                onClick={() => onToggleExpand(item.code)}
              >
                Voices ({langVoices.length}) {isExpanded ? '▲' : '▼'}
              </button>
            </div>

            {isExpanded && (
              <div style={{ gridColumn: '1 / -1', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 16px', margin: '2px 0 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    Giọng đọc (Voices) của {item.name} ({item.code.toUpperCase()}):
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{langVoices.length} voice đã lưu</span>
                </div>
                {langVoices.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                    Chưa có voice nào cho ngôn ngữ này. Hãy chọn ngôn ngữ và nhập mã ElevenLabs voice ID ở form phía trên để thêm.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {langVoices.map((voice) => {
                      const isDefault = item.defaultVoiceId === voice.id;
                      return (
                        <div key={voice.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--cream)', borderRadius: '6px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong>Voice #{voice.id}</strong>
                            <code style={{ background: 'var(--paper)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--line)' }}>{voice.providerVoiceKey}</code>
                            {isDefault ? (
                              <span className="status status--published" style={{ fontSize: '10px', padding: '2px 6px' }}>★ Voice mặc định</span>
                            ) : (
                              <button
                                type="button"
                                className="quiet-button"
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => onSetDefaultVoice(item.code, voice.id)}
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="quiet-button"
                            style={{ color: 'var(--coral)', borderColor: 'var(--coral)', fontSize: '11px' }}
                            onClick={() => onDeleteVoice(voice.id)}
                          >
                            Xóa voice
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
