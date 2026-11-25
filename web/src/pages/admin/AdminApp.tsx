/**
 * @file AdminApp.tsx
 * @description Bộ điều phối phân hệ Quản trị (Admin / Content Studio): Quản lý token, điều hướng các tab, hiển thị popup và gắn kết workflow.
 * @screen Toàn bộ giao diện quản trị Admin (URL: `/admin`).
 * @activityDiagram Quản lý tổng thể phân hệ quản trị và quy trình xuất bản nội dung.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Tab mặc định khi mở: State `activeNav` (mặc định là 'Nội dung').
 *  - Bộ lọc bài viết: State `statusFilter`.
 */

import { useEffect, useMemo, useState } from 'react';
import { api, type ApiReviewEvent } from '../../api';
import { initialItems } from '../../constants/languages';
import { mapContent } from '../../utils/formatters';
import { useAdminData } from '../../hooks/useAdminData';
import { useContentWorkflow } from '../../hooks/useContentWorkflow';

import { LoginScreen } from './LoginScreen';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminTopbar } from '../../components/admin/AdminTopbar';
import { OverviewPanel } from '../../components/admin/OverviewPanel';
import { QrPanel } from '../../components/admin/QrPanel';
import { UserPanel } from '../../components/admin/UserPanel';
import { LanguageVoicesPanel } from '../../components/admin/LanguageVoicesPanel';
import { LocationPoiPanel } from '../../components/admin/LocationPoiPanel';
import { ContentFilters, type StatusFilterType } from '../../components/admin/ContentFilters';
import { ContentListTable } from '../../components/admin/ContentListTable';
import { ContentMatrixTable } from '../../components/admin/ContentMatrixTable';
import { ContentDetailStudio } from '../../components/admin/ContentDetailStudio';
import { ContentReadinessCard } from '../../components/admin/ContentReadinessCard';
import { ContentAudioConsole } from '../../components/admin/ContentAudioConsole';
import { ContentWorkflowActions } from '../../components/admin/ContentWorkflowActions';
import { CreateContentModal } from '../../components/admin/CreateContentModal';
import { ContentHistoryModal } from '../../components/admin/ContentHistoryModal';
import { VisitorPreviewModal } from '../../components/admin/VisitorPreviewModal';
import { ChangePasswordModal } from '../../components/admin/ChangePasswordModal';

export function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('audio-guide-token') ?? '');
  const [activeNav, setActiveNav] = useState('Nội dung');
  const [selectedVoiceId, setSelectedVoiceId] = useState<number | undefined>(undefined);
  const [showVisitor, setShowVisitor] = useState(false);
  const [history, setHistory] = useState<ApiReviewEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [showDetail, setShowDetail] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('');

  const isContentPage = activeNav === 'Nội dung';

  // [TÍNH NĂNG: Hook nạp và đồng bộ dữ liệu quản trị từ API]
  const {
    items,
    setItems,
    voices,
    setVoices,
    pois,
    setPois,
    languages,
    setLanguages,
    selectedId,
    setSelectedId,
  } = useAdminData(
    token,
    () => {
      setToken('');
      localStorage.removeItem('audio-guide-token');
    },
    (msg) => setToast(msg)
  );

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? initialItems[0];
  const isDirty = editTitle !== selected.title || editBody !== selected.body;
  const audioReady = Boolean(selected.hasAudio && !isDirty);
  const fieldsReady = Boolean(editTitle.trim() && editBody.trim());
  const sourceCounterpart = items.find((item) => item.poiId === selected.poiId && item.languageCode !== selected.languageCode);
  const pendingCount = useMemo(() => items.filter((item) => item.status === 'Chờ duyệt').length, [items]);

  const targetLanguages = useMemo(() => {
    if (!selected?.languageCode) return [];
    return languages.filter(
      (lang) => lang.isActive && lang.code.toLowerCase() !== selected.languageCode?.toLowerCase()
    );
  }, [languages, selected?.languageCode]);

  useEffect(() => {
    if (targetLanguages.length > 0) {
      const currentExists = targetLanguages.some((l) => l.code === selectedTargetLang);
      if (!currentExists) {
        const preferred =
          targetLanguages.find((l) => l.code === (selected.languageCode?.toLowerCase() === 'vi' ? 'en' : 'vi')) ??
          targetLanguages[0];
        setSelectedTargetLang(preferred.code);
      }
    } else {
      setSelectedTargetLang('');
    }
  }, [selected?.languageCode, targetLanguages]);

  useEffect(() => {
    setEditTitle(selected.title);
    setEditBody(selected.body);
  }, [selected.id, selected.title, selected.body]);

  const currentLang = languages.find((item) => item.code.toUpperCase() === selected.language);
  const currentLangVoices = voices.filter(
    (item) => item.languageCode.toUpperCase() === selected.language && item.isAvailable
  );
  const activeVoiceId =
    selectedVoiceId && currentLangVoices.some((v) => v.id === selectedVoiceId)
      ? selectedVoiceId
      : currentLang?.defaultVoiceId && currentLangVoices.some((v) => v.id === currentLang.defaultVoiceId)
      ? currentLang.defaultVoiceId
      : currentLangVoices[0]?.id;

  // [TÍNH NĂNG: Hook xử lý các thao tác workflow biên tập]
  const {
    isTranslating,
    publishSelected,
    transitionSelected,
    generateAudio,
    uploadAudio,
    saveContent,
    deleteCurrentContent,
    translateSelected,
    createContent,
  } = useContentWorkflow({
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
    onToast: (msg) => setToast(msg),
  });

  const openHistory = async () => {
    if (!selected.versionId) return;
    try {
      setHistory(await api.contentHistory(token, selected.versionId));
      setShowHistory(true);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể tải lịch sử phiên bản');
    }
  };

  const visibleItems = items.filter((item) => {
    const matchesSearch = `${item.title} ${item.place} ${item.language}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'NEEDS_REVIEW' ? Boolean(item.needsReview) : item.rawStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  if (!token) {
    return <LoginScreen onLoginSuccess={setToken} />;
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <AdminSidebar
        activeNav={activeNav}
        pendingCount={pendingCount}
        sidebarCollapsed={sidebarCollapsed}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          setShowDetail(false);
        }}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        onChangePassword={() => setShowChangePassword(true)}
        onLogout={() => {
          localStorage.removeItem('audio-guide-token');
          setToken('');
          setToast('Đã đăng xuất.');
        }}
      />

      <main className="main">
        <AdminTopbar
          activeNav={activeNav}
          pendingCount={pendingCount}
          onShowNotification={() =>
            setToast(pendingCount > 0 ? `Có ${pendingCount} bài đang chờ duyệt.` : 'Không có thông báo mới.')
          }
          onOpenCreate={() => setShowCreate(true)}
        />

        <section className="workspace">
          {isContentPage && !showDetail && (
            <div className="workspace-heading">
              <div>
                <h2>Nội dung thuyết minh</h2>
              </div>
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setToast('Đã xóa bộ lọc.');
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {toast && <p className="toast" role="status" style={{ margin: '0 0 16px' }}>{toast}</p>}

          {activeNav === 'Tổng quan' ? (
            <OverviewPanel items={items} pois={pois} voices={voices} token={token} />
          ) : activeNav === 'QR code' ? (
            <QrPanel token={token} pois={pois} onToast={setToast} />
          ) : activeNav === 'Người dùng' ? (
            <UserPanel token={token} onToast={setToast} />
          ) : activeNav === 'Ngôn ngữ & giọng đọc' ? (
            <LanguageVoicesPanel
              token={token}
              onToast={setToast}
              onLanguagesChange={setLanguages}
              onVoicesChange={setVoices}
            />
          ) : activeNav === 'Địa điểm & POI' ? (
            <LocationPoiPanel token={token} onToast={setToast} onPoisChange={setPois} />
          ) : (
            <div className={`content-grid ${showDetail ? 'is-detail' : ''}`}>
              {!showDetail && (
                <section className="content-list" aria-label="Content list">
                  <ContentFilters
                    statusFilter={statusFilter}
                    search={search}
                    viewMode={viewMode}
                    items={items}
                    onSelectStatus={setStatusFilter}
                    onSearchChange={setSearch}
                    onToggleViewMode={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
                  />

                  {viewMode === 'list' ? (
                    <ContentListTable
                      items={visibleItems}
                      pois={pois}
                      onSelectItem={(item) => {
                        setSelectedId(item.id);
                        setShowDetail(true);
                        setShowVisitor(false);
                        setToast('');
                      }}
                    />
                  ) : (
                    <ContentMatrixTable
                      pois={pois}
                      items={items}
                      onSelectCell={(cell) => {
                        setSelectedId(cell.id);
                        setViewMode('list');
                        setShowDetail(true);
                      }}
                      onEmptyCellClick={() =>
                        setToast('Chưa có nội dung cho ngôn ngữ này. Hãy tạo bản nháp mới.')
                      }
                    />
                  )}

                  <button
                    type="button"
                    className="load-more"
                    onClick={() => setToast(`${visibleItems.length} nội dung`)}
                  >
                    {visibleItems.length} nội dung
                  </button>
                </section>
              )}

              {showDetail && (
                <section className="detail-panel content-studio" aria-label="Content details">
                  <ContentDetailStudio
                    selected={selected}
                    sourceCounterpart={sourceCounterpart}
                    pois={pois}
                    editTitle={editTitle}
                    editBody={editBody}
                    isDirty={isDirty}
                    fieldsReady={fieldsReady}
                    audioReady={audioReady}
                    onEditTitleChange={setEditTitle}
                    onEditBodyChange={setEditBody}
                    onBackToList={() => setShowDetail(false)}
                  />

                  <ContentReadinessCard
                    selected={selected}
                    editTitle={editTitle}
                    editBody={editBody}
                    audioReady={audioReady}
                    onConfirmReviewed={async () => {
                      if (!selected.versionId) return;
                      try {
                        const reviewed = await api.confirmReviewed(token, selected.versionId);
                        const next = mapContent(reviewed, selected.id - 1);
                        setItems((current) =>
                          current.map((item) => (item.versionId === selected.versionId ? { ...item, ...next } : item))
                        );
                        setToast('Review confirmed.');
                      } catch (error) {
                        setToast(error instanceof Error ? error.message : 'Could not confirm review');
                      }
                    }}
                  />

                  <ContentAudioConsole selected={selected} />

                  <ContentWorkflowActions
                    selected={selected}
                    items={items}
                    editBody={editBody}
                    isDirty={isDirty}
                    fieldsReady={fieldsReady}
                    audioReady={audioReady}
                    targetLanguages={targetLanguages}
                    selectedTargetLang={selectedTargetLang}
                    isTranslating={isTranslating}
                    currentLangVoices={currentLangVoices}
                    activeVoiceId={activeVoiceId}
                    currentLang={currentLang}
                    onOpenVisitorPreview={() => setShowVisitor(true)}
                    onOpenHistory={openHistory}
                    onSelectTargetLang={setSelectedTargetLang}
                    onTranslate={translateSelected}
                    onSaveContent={saveContent}
                    onUploadAudio={uploadAudio}
                    onSelectVoiceId={setSelectedVoiceId}
                    onGenerateAudio={generateAudio}
                    onDeleteCurrentContent={deleteCurrentContent}
                    onTransition={transitionSelected}
                    onPublish={publishSelected}
                  />
                </section>
              )}
            </div>
          )}
        </section>

        {activeNav === 'Tổng quan' && (
          <section className="insight-strip">
            <div>
              <span className="strip-label">Bước tiếp theo</span>
              <strong>
                {selected.status === 'Chờ duyệt'
                  ? 'Kiểm tra nội dung trước khi xuất bản'
                  : 'Chọn một bản dịch cần rà soát'}
              </strong>
            </div>
            <div className="strip-action">
              <span className="strip-line" />
              <button
                type="button"
                onClick={() => {
                  setActiveNav('Nội dung');
                  setStatusFilter('PENDING_REVIEW');
                  setSearch('');
                  setToast('Đã mở hàng đợi kiểm duyệt.');
                }}
              >
                Mở hàng đợi <span>↗</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {showVisitor && <VisitorPreviewModal selected={selected} onClose={() => setShowVisitor(false)} />}
      {showHistory && <ContentHistoryModal history={history} onClose={() => setShowHistory(false)} />}
      <ChangePasswordModal
        token={token}
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onToast={(msg) => setToast(msg)}
      />
      {showCreate && (
        <CreateContentModal
          pois={pois}
          languages={languages}
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => {
            void createContent(data, () => {
              setShowDetail(true);
              setShowCreate(false);
            });
          }}
        />
      )}
    </div>
  );
}
