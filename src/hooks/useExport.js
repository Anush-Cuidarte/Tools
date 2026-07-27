import { useCallback } from 'react';
import html2canvas from 'html2canvas';

const FOOTER_HEIGHT = 50;
const FOOTER_TEXT = 'Anush.Cuidarte Tools';
const BG_COLOR = '#FDF8F5';
const TEXT_COLOR = '#C97B84';

function useExport() {
  const exportToPng = useCallback(async (element, filename = 'export') => {
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: BG_COLOR,
        logging: false,
      });

      // Create a taller canvas with footer
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + FOOTER_HEIGHT * 2;

      const ctx = finalCanvas.getContext('2d');

      // Background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw the original content
      ctx.drawImage(canvas, 0, 0);

      // Draw footer separator line
      const footerY = canvas.height + 1;
      ctx.strokeStyle = '#E9D5C8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20 * 2, footerY);
      ctx.lineTo(finalCanvas.width - 20 * 2, footerY);
      ctx.stroke();

      // Draw footer text
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = `700 ${14 * 2}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FOOTER_TEXT, finalCanvas.width / 2, footerY + FOOTER_HEIGHT);

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al exportar:', err);
    }
  }, []);

  return { exportToPng };
}

export default useExport;
