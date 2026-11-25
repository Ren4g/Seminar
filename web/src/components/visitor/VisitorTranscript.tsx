/**
 * @file VisitorTranscript.tsx
 * @description Khung bản chép lời (Transcript) của bài thuyết minh, cho phép khách mở rộng hoặc thu gọn.
 * @screen Màn hình chi tiết điểm tham quan (Visitor Detail).
 * @activityDiagram Bước "Khách xem bản ghi văn bản đồng bộ với audio".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nhãn nút bấm: Sửa theo ngôn ngữ (Bản chép lời / Transcript).
 *  - Style hiển thị: Class `.visitor-transcript`, `.visitor-transcript-text`.
 */

type VisitorTranscriptProps = {
  narrationText: string;
  language: string;
  isExpanded: boolean;
  onToggle: () => void;
};

// [TÍNH NĂNG: Khung bản chép lời thu gọn / mở rộng]
export function VisitorTranscript({
  narrationText,
  language,
  isExpanded,
  onToggle,
}: VisitorTranscriptProps) {
  const isVi = language === 'vi';

  return (
    <section className="visitor-transcript">
      <button type="button" onClick={onToggle}>
        <span>{isVi ? 'Bản chép lời' : 'Transcript'}</span>
        <span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && <div className="visitor-transcript-text">{narrationText}</div>}
    </section>
  );
}
