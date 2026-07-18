import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getDownloadPageUrl } from '../../lib/downloadPageUrl';
import styles from './ApkQrCode.module.css';

interface ApkQrCodeProps {
  visible?: boolean;
  /** Pixel size of the QR image (default 128). */
  size?: number;
  /** Override encoded URL (default: download page). */
  url?: string;
  caption?: string;
}

export function ApkQrCode({
  visible = true,
  size = 128,
  url,
  caption = 'Zeskanuj telefonem',
}: ApkQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const targetUrl = url ?? getDownloadPageUrl();

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    QRCode.toDataURL(targetUrl, {
      width: size,
      margin: 1,
      color: { dark: '#ebe7e0', light: '#14110f' },
    })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, size, targetUrl]);

  if (!visible || !dataUrl) return null;

  return (
    <div className={styles.wrap}>
      <img src={dataUrl} alt="" className={styles.qr} width={size} height={size} />
      {caption ? <p className={styles.caption}>{caption}</p> : null}
    </div>
  );
}
