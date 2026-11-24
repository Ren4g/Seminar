/**
 * @file useContentWorkflow.ts
 * @description Hook xử lý nghiệp vụ workflow nội dung: Lưu nháp, Dịch tự động AI, Tạo TTS ElevenLabs, Upload MP3, Gửi duyệt, Duyệt, Xuất bản.
 * @screen Content Studio trong Admin.
 * @activityDiagram Quản lý vòng đời bài viết từ soạn thảo, dịch thuật, tạo audio đến phê duyệt và xuất bản.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Giới hạn dung lượng MP3 tải lên: Biến `MAX_AUDIO_SIZE_BYTES`.
 */

import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { api, type ApiLanguage, type ApiVoice } from '../api';
import type { ContentItem } from '../types/content';
import { mapContent } from '../utils/formatters';

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type UseContentWorkflowParams = {
  token: string;
  items: ContentItem[];
  setItems: Dispatch<SetStateAction<ContentItem[]>>;
  selected: ContentItem;
  setSelectedId: Dispatch<SetStateAction<number>>;
  editTitle: string;
  editBody: string;
  targetLanguages: ApiLanguage[];
  selectedTargetLang: string;
  currentLangVoices: ApiVoice[];
  activeVoiceId?: number;
  onToast: (msg: string) => void;
};

// [TÍNH NĂNG: Hook điều khiển các tác vụ nghiệp vụ Content Studio]
export function useContentWorkflow({
  token,
  items,
  setItems,
  selected,
  setSelectedId,
  editTitle,
  editBody,
  targetLanguages,
  selectedTargetLang,
  currentLangVoices,
  activeVoiceId,
  onToast,
}: UseContentWorkflowParams) {
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // [TÍNH NĂNG: Xuất bản bài viết đã được phê duyệt]
  const publishSelected = async () => {
    if (!selected?.versionId) return;
    try {
      const published = await api.transition(token, selected.versionId, 'publish');
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? { ...item, rawStatus: published.status, status: 'Đã xuất bản', updated: 'Vừa xong' }
            : item
        )
      );
      onToast('Đã xuất bản phiên bản hiện tại.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể xuất bản');
    }
  };

  // [TÍNH NĂNG: Chuyển đổi trạng thái workflow]
  const transitionSelected = async (
    action: 'submit' | 'withdraw' | 'approve' | 'unpublish' | 'republish' | 'reject'
  ) => {
    if (!selected?.versionId) return;
    const reason = action === 'reject' ? window.prompt('Lý do từ chối phiên bản:')?.trim() : undefined;
    if (action === 'reject' && !reason) return;
    try {
      const result =
        action === 'reject'
          ? await api.reject(token, selected.versionId, reason as string)
          : await api.transition(token, selected.versionId, action);
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                rawStatus: result.status,
                needsReview: Boolean(result.needsReview),
                status:
                  result.status === 'PENDING_REVIEW'
                    ? 'Chờ duyệt'
                    : result.status === 'APPROVED'
                    ? 'Đã duyệt'
                    : result.status === 'PUBLISHED'
                    ? 'Đã xuất bản'
                    : result.status === 'UNPUBLISHED'
                    ? 'Đã gỡ xuất bản'
                    : result.status === 'REJECTED'
                    ? 'Cần rà soát'
                    : 'Đang soạn',
                updated: 'Vừa cập nhật',
              }
            : item
        )
      );
      onToast(`Đã thực hiện: ${action}.`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể chuyển trạng thái');
    }
  };

  // [TÍNH NĂNG: Tạo audio giọng đọc ElevenLabs]
  const generateAudio = async () => {
    if (!selected?.versionId) return;
    const voice = currentLangVoices.find((item) => item.id === activeVoiceId) ?? currentLangVoices[0];
    if (!voice) {
      onToast(`Chưa có giọng đọc khả dụng cho ${selected.language}.`);
      return;
    }
    try {
      const generated = await api.elevenLabsAudio(token, selected.versionId, voice.id);
      const next = mapContent(generated, selected.id - 1);
      setItems((current) =>
        current.map((item) => (item.id === selected.id ? { ...item, ...next, updated: 'Vừa tạo audio ElevenLabs' } : item))
      );
      onToast(`Đã tạo audio bằng ElevenLabs (${voice.providerVoiceKey}).`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể tạo audio');
    }
  };

  // [TÍNH NĂNG: Upload file âm thanh MP3]
  const uploadAudio = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selected?.versionId) return;
    if (!['audio/mpeg', 'audio/mp3'].includes(file.type) && !file.name.toLowerCase().endsWith('.mp3')) {
      onToast('Chỉ hỗ trợ file định dạng MP3.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      onToast('Dung lượng audio tối đa là 10 MB.');
      event.target.value = '';
      return;
    }
    try {
      const uploaded = await api.uploadAudio(token, selected.versionId, file);
      const next = mapContent(uploaded, selected.id - 1);
      setItems((current) =>
        current.map((item) => (item.id === selected.id ? { ...item, ...next, updated: 'Uploaded just now' } : item))
      );
      onToast(`Đã ghi nhận file ${file.name}.`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể upload audio');
    }
    event.target.value = '';
  };

  // [TÍNH NĂNG: Lưu văn bản bản nháp]
  const saveContent = async () => {
    if (!selected.versionId) return;
    try {
      const updated = await api.updateContent(token, selected.versionId, editTitle, editBody);
      const isTextSame = selected.body === editBody;
      const keepAudio = isTextSame && Boolean(selected.hasAudio);
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                title: updated.title,
                body: updated.narrationText,
                updated: 'Vừa chỉnh sửa',
                hasAudio: keepAudio,
                audioUrl: keepAudio ? item.audioUrl : undefined,
              }
            : item
        )
      );
      onToast(
        isTextSame
          ? 'Đã lưu tiêu đề mới (audio được giữ nguyên).'
          : 'Đã lưu nội dung. Audio cũ đã hết hạn, cần tạo lại.'
      );
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể lưu nội dung');
    }
  };

  // [TÍNH NĂNG: Xóa bài viết]
  const deleteCurrentContent = async () => {
    if (!selected?.versionId) return;
    const actionName = selected.status === 'Đã gỡ xuất bản' ? 'bài viết đã gỡ xuất bản' : 'bản nháp';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${actionName} "${selected.title}" (Phiên bản #${selected.versionId})?`))
      return;
    try {
      await api.deleteContent(token, selected.versionId);
      const remaining = items.filter((item) => item.versionId !== selected.versionId);
      setItems(remaining);
      if (remaining.length > 0) setSelectedId(remaining[0].id);
      onToast('Đã xóa thành công.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể xóa');
    }
  };

  // [TÍNH NĂNG: Dịch tự động bằng AI sang ngôn ngữ đích]
  const translateSelected = async () => {
    if (!selected?.versionId) return;
    if (!selectedTargetLang) {
      onToast('Vui lòng chọn ngôn ngữ đích.');
      return;
    }
    const targetLangInfo = targetLanguages.find((l) => l.code === selectedTargetLang);
    const targetName = targetLangInfo?.name || selectedTargetLang.toUpperCase();
    const existingTarget = items.find(
      (item) => item.poiId === selected.poiId && item.languageCode?.toLowerCase() === selectedTargetLang.toLowerCase()
    );

    if (existingTarget) {
      if (existingTarget.rawStatus === 'PENDING_REVIEW') {
        const msg = `Bản dịch ${targetName} của điểm tham quan này đang ở trạng thái Chờ duyệt. Không thể tạo bản dịch mới lúc này.`;
        onToast(msg);
        window.alert(msg);
        return;
      }
      if (['DRAFT', 'REJECTED'].includes(existingTarget.rawStatus ?? '')) {
        const ok = window.confirm(
          `Điểm tham quan này đã có bản ${existingTarget.status.toLowerCase()} cho ngôn ngữ ${targetName} ("${existingTarget.title}").\n\nBạn có chắc chắn muốn dịch tự động và ghi đè nội dung bản nháp này không?`
        );
        if (!ok) return;
      }
    }

    setIsTranslating(true);
    try {
      const translated = await api.translateContent(token, selected.versionId, selectedTargetLang);
      const next = mapContent(translated, items.length);
      setItems((current) =>
        current.some((item) => item.versionId === next.versionId)
          ? current.map((item) => (item.versionId === next.versionId ? { ...item, ...next, updated: 'Vừa cập nhật' } : item))
          : [...current, next]
      );
      setSelectedId(next.id);
      onToast(`Đã tạo bản dịch tự động sang ${targetName} (Bản nháp - Cần rà soát).`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể dịch nội dung');
    } finally {
      setIsTranslating(false);
    }
  };

  // [TÍNH NĂNG: Tạo mới nội dung bản nháp]
  const createContent = async (
    data: { poiId: string; languageCode: string; title: string; narrationText: string },
    onSuccess: () => void
  ) => {
    if (!data.poiId || !data.title.trim() || !data.narrationText.trim()) {
      onToast('Vui lòng nhập POI, tiêu đề và nội dung.');
      return;
    }
    try {
      const created = await api.createContent(
        token,
        Number(data.poiId),
        data.languageCode,
        data.title.trim(),
        data.narrationText.trim()
      );
      const next = mapContent(created, items.length);
      setItems((current) => [...current, next]);
      setSelectedId(next.id);
      onSuccess();
      onToast('Đã tạo nội dung mới ở trạng thái bản nháp.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể tạo nội dung');
    }
  };

  return {
    isTranslating,
    publishSelected,
    transitionSelected,
    generateAudio,
    uploadAudio,
    saveContent,
    deleteCurrentContent,
    translateSelected,
    createContent,
  };
}
