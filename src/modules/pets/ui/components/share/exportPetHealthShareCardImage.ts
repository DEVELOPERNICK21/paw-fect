import {
  ImageFormat,
  type CanvasRef,
  type SkImage,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import type { ViewShotRef } from 'react-native-view-shot';

export async function waitForNextFrame(): Promise<void> {
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function waitForPaintFrames(frameCount = 3): Promise<void> {
  for (let i = 0; i < frameCount; i += 1) {
    await waitForNextFrame();
  }
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
  await waitForPaintFrames();
  canvasRef.redraw();
  const snapshot = await canvasRef.makeImageSnapshotAsync();
  if (!snapshot) {
    throw new Error('Share card snapshot failed.');
  }
  return encodeSkiaImageToPngDataUri(snapshot);
}

function normalizeShareUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
}

export async function captureViewShotPngUri(
  viewShotRef: ViewShotRef | null,
): Promise<string> {
  if (!viewShotRef) {
    throw new Error('Share card capture view is not ready.');
  }
  await waitForPaintFrames();
  const uri = await viewShotRef.capture();
  if (!uri) {
    throw new Error('Share card capture returned an empty file.');
  }
  return normalizeShareUri(uri);
}

export async function captureShareCardPngUri(options: {
  canvasRef: CanvasRef | null;
  viewShotRef: ViewShotRef | null;
}): Promise<string> {
  const { canvasRef, viewShotRef } = options;
  if (viewShotRef) {
    try {
      return await captureViewShotPngUri(viewShotRef);
    } catch {
      // Fall back to Skia snapshot when ViewShot cannot rasterize the canvas.
    }
  }
  return captureCanvasPngDataUri(canvasRef);
}

export function buildShareSheetOptions(input: {
  title: string;
  message: string;
  imageUri: string;
}): {
  title: string;
  subject: string;
  message?: string;
  url: string;
  type: string;
  filename: string;
  failOnCancel: boolean;
} {
  const imageUri = normalizeShareUri(input.imageUri);
  const isDataUri = imageUri.startsWith('data:');

  return {
    title: input.title,
    subject: input.title,
    message: Platform.OS === 'android' && !isDataUri ? input.message : undefined,
    url: imageUri,
    type: 'image/png',
    filename: 'paw-fect-health-card.png',
    failOnCancel: false,
  };
}
