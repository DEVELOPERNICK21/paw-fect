import {
  ImageFormat,
  type CanvasRef,
  type SkImage,
} from '@shopify/react-native-skia';

export async function waitForNextFrame(): Promise<void> {
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function encodeSkiaImageToPngDataUri(image: SkImage): Promise<string> {
  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);
  return `data:image/png;base64,${base64}`;
}

export async function captureCanvasPngDataUri(
  canvasRef: CanvasRef | null,
): Promise<string> {
  if (!canvasRef) {
    throw new Error('Share card canvas is not ready.');
  }
  await waitForNextFrame();
  const snapshot = await canvasRef.makeImageSnapshotAsync();
  if (!snapshot) {
    throw new Error('Share card snapshot failed.');
  }
  return encodeSkiaImageToPngDataUri(snapshot);
}
