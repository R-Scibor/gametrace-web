import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getApkDownloadUrl } from '../../lib/apkDownloadUrl';
import styles from './ApkQrCode.module.css';

interface ApkQrCodeProps {
  visible?: boolean;
}

export function ApkQrCode({ visible = true }: ApkQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    const url = getApkDownloadUrl();

    QRCode.toDataURL(url, {
      width: 128,
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
  }, [visible]);

  if (!visible || !dataUrl) return null;

  return (
    <div className={styles.wrap}>
      <img src={dataUrl} alt="" className={styles.qr} width={128} height={128} />
      <p className={styles.caption}>Zeskanuj telefonem</p>
    </div>
  );
}