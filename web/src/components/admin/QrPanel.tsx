/**
 * @file QrPanel.tsx
 * @description Màn hình "QR code": Tạo mã QR cho từng điểm tham quan, xem trước mã QR (QRCodeCanvas), tải ảnh PNG để in ấn và mở nhanh link visitor.
 * @screen Tab "QR code" trong trang quản trị Admin.
 * @activityDiagram Bước "Tạo mã QR cho điểm tham quan" -> "In mã QR đặt tại di tích thực địa".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Kích thước ảnh QR hiển thị: Thuộc tính `size={224}` trong `<QRCodeCanvas />`.
 *  - Nút tải ảnh PNG: Hàm `download()`.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { api, type ApiPoi, type ApiQr } from '../../api';

type QrPanelProps = {
  token: string;
  pois: ApiPoi[];
  onToast: (message: string) => void;
};

// [TÍNH NĂNG: Quản lý mã QR cho các điểm tham quan]
export function QrPanel({ token, pois, onToast }: QrPanelProps) {
  const [codes, setCodes] = useState<ApiQr[]>([]);
  const [poiId, setPoiId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const reload = async () => setCodes(await api.qrCodes());

  useEffect(() => {
    void reload().catch((error: unknown) => {
      const text = error instanceof Error ? error.message : 'Không thể tải QR code';
      setMessage(text);
      onToast(text);
    });
  }, []);

  // [TÍNH NĂNG: Tạo hoặc cập nhật mã QR cho 1 POI]
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!poiId) {
      setMessage('Vui lòng chọn POI trước khi tạo QR.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await api.saveQr(token, Number(poiId));
      await reload();
      setPoiId('');
      setMessage('Đã tạo hoặc cập nhật QR code thành công.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Không thể lưu QR code';
      setMessage(text);
      onToast(text);
    } finally {
      setBusy(false);
    }
  };

  // [TÍNH NĂNG: Cập nhật lại đường dẫn cho tất cả mã QR hàng loạt]
  const refreshAll = async () => {
    setBusy(true);
    setMessage('');
    try {
      await Promise.all(codes.map((code) => api.saveQr(token, code.poiId)));
      await reload();
      setMessage('Đã cập nhật link cho tất cả QR code.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Không thể cập nhật các link QR';
      setMessage(text);
      onToast(text);
    } finally {
      setBusy(false);
    }
  };

  // [TÍNH NĂNG: Tải mã QR về máy tính dạng file ảnh PNG để in ấn]
  const download = (code: ApiQr) => {
    const canvas = document.getElementById(`qr-canvas-${code.id}`) as HTMLCanvasElement | null;
    if (!canvas) {
      setMessage('Không thể tạo ảnh QR để tải xuống.');
      return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-poi-${code.poiId}.png`;
    link.click();
  };

  return (
    <section className="catalog-panel">
      <div className="catalog-heading">
        <div>
          <h2>QR code cho từng điểm tham quan.</h2>
          <p className="form-note">Ảnh QR được tạo từ đường dẫn visitor và có thể tải xuống để in.</p>
        </div>
        <span className="catalog-count">{codes.length} QR code</span>
      </div>

      <form className="crud-form qr-form" onSubmit={save}>
        <label>
          POI
          <select value={poiId} onChange={(event) => setPoiId(event.target.value)} required disabled={busy}>
            <option value="">Chọn POI</option>
            {pois.map((poi) => {
              const name =
                poi.translations.find((item) => item.languageCode === 'vi')?.name ??
                poi.translations.find((item) => item.languageCode === 'en')?.name ??
                `POI #${poi.id}`;
              return (
                <option key={poi.id} value={poi.id}>
                  POI #{poi.id} · {name}
                </option>
              );
            })}
          </select>
        </label>
        <p className="form-note">Đường dẫn visitor sẽ được hệ thống tự tạo theo POI và ngôn ngữ mặc định.</p>
        {pois.length === 0 && (
          <p className="empty-state">Chưa có POI khả dụng. Hãy tạo POI ở mục “Địa điểm & POI” trước.</p>
        )}
        <button type="submit" className="primary-button" disabled={busy || pois.length === 0}>
          {busy ? 'Đang lưu…' : 'Tạo hoặc cập nhật QR'}
        </button>
        {message && <p className="toast" role="status">{message}</p>}
      </form>

      {codes.length > 0 && (
        <button
          className="quiet-button qr-refresh-all"
          type="button"
          disabled={busy}
          onClick={() => void refreshAll()}
        >
          {busy ? 'Đang cập nhật…' : 'Cập nhật link cho tất cả QR'}
        </button>
      )}

      {/* [TÍNH NĂNG: Lưới hiển thị các thẻ QR code] */}
      <div className="qr-card-grid">
        {codes.map((code) => {
          const poi = pois.find((item) => item.id === code.poiId);
          const name =
            poi?.translations.find((item) => item.languageCode === 'vi')?.name ??
            poi?.translations.find((item) => item.languageCode === 'en')?.name ??
            `POI #${code.poiId}`;
          return (
            <article className="qr-card" key={code.id}>
              <div className="qr-card-image">
                <QRCodeCanvas
                  id={`qr-canvas-${code.id}`}
                  value={code.targetUrl}
                  size={224}
                  level="H"
                  marginSize={2}
                  title={`QR code for ${name}`}
                />
              </div>
              <div className="qr-card-content">
                <div>
                  <span className="qr-card-kicker">QR #{code.id}</span>
                  <h3>{name}</h3>
                </div>
                <a className="qr-card-url" href={code.targetUrl} target="_blank" rel="noreferrer">
                  {code.targetUrl}
                </a>
                <div className="qr-card-actions">
                  <a className="quiet-button" href={code.targetUrl} target="_blank" rel="noreferrer">
                    Mở visitor ↗
                  </a>
                  <button className="primary-button" type="button" onClick={() => download(code)}>
                    Tải PNG
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {codes.length === 0 && <p className="empty-state">Chưa có QR code. Chọn POI để tạo đường dẫn tự động.</p>}
      </div>
    </section>
  );
}
