/**
 * Dog photo: upload, crop (via cropperjs), and persist in localStorage.
 */

const STORAGE_KEY = 'puppycal-dog-photo';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const OUTPUT_SIZE = 400; // px, square crop output
const JPEG_QUALITY = 0.85;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function getDogPhoto(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveDogPhoto(dataUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, dataUrl);
  } catch {
    // QuotaExceededError — silently fail
  }
}

export function clearDogPhoto(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function cropImageWithCanvas(
  img: HTMLImageElement,
  cropData: { x: number; y: number; width: number; height: number }
): string {
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    img,
    cropData.x,
    cropData.y,
    cropData.width,
    cropData.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export function openPhotoCropModal(onSave: (dataUrl: string) => void): void {
  // Remove existing dialog if any
  document.querySelector('.photo-crop-dialog')?.remove();

  const dialog = document.createElement('dialog');
  dialog.className = 'photo-crop-dialog share-dialog';

  const existingPhoto = getDogPhoto();

  dialog.innerHTML = `
    <div class="share-dialog-header">
      <p class="share-dialog-title">Dog photo</p>
      <button type="button" class="share-dialog-close" aria-label="Close">&times;</button>
    </div>
    <div class="share-dialog-body">
      <div class="photo-crop-area" id="photo-crop-area">
        ${
          existingPhoto
            ? `<div class="photo-crop-current">
                <img src="${existingPhoto}" alt="Current dog photo" class="photo-crop-current-img" />
              </div>`
            : '<p class="text-sm text-gray-400">No photo yet</p>'
        }
      </div>
      <div id="photo-crop-controls" style="display:none;width:100%;text-align:center">
        <div class="photo-crop-preview-wrap">
          <img id="photo-crop-img" alt="Crop preview" style="max-width:100%;display:block" />
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
          <button type="button" id="photo-crop-cancel" class="share-format-btn">Cancel</button>
          <button type="button" id="photo-crop-confirm" class="share-download-btn" style="width:auto;padding:8px 24px">Save</button>
        </div>
      </div>
      <div id="photo-initial-buttons" style="display:flex;gap:8px;width:100%">
        <label class="share-download-btn" style="cursor:pointer;flex:1;text-align:center">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          ${existingPhoto ? 'Change photo' : 'Upload photo'}
          <input type="file" id="photo-file-input" accept="image/jpeg,image/png,image/webp" style="display:none" />
        </label>
        ${existingPhoto ? '<button type="button" id="photo-remove-btn" class="share-format-btn" style="padding:8px 16px;color:#dc2626">Remove</button>' : ''}
      </div>
      <p id="photo-error-msg" class="text-xs text-red-500" style="min-height:16px"></p>
    </div>`;

  document.body.appendChild(dialog);
  dialog.showModal();

  const fileInput = dialog.querySelector('#photo-file-input') as HTMLInputElement;
  const cropArea = dialog.querySelector('#photo-crop-area') as HTMLElement;
  const cropControls = dialog.querySelector('#photo-crop-controls') as HTMLElement;
  const initialButtons = dialog.querySelector('#photo-initial-buttons') as HTMLElement;
  const cropImg = dialog.querySelector('#photo-crop-img') as HTMLImageElement;
  const errorMsg = dialog.querySelector('#photo-error-msg') as HTMLElement;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cropperInstance: any = null;

  function showError(msg: string): void {
    errorMsg.textContent = msg;
  }

  // Close button
  dialog.querySelector('.share-dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });

  // Backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  // Remove button
  dialog.querySelector('#photo-remove-btn')?.addEventListener('click', () => {
    clearDogPhoto();
    onSave('');
    dialog.close();
  });

  // File selection
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showError('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      showError('Image must be under 5 MB.');
      return;
    }

    // Validate it's a real image
    try {
      await createImageBitmap(file);
    } catch {
      showError('Could not read this file as an image.');
      return;
    }

    showError('');

    // Load image for cropping
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      cropImg.src = url;
      cropArea.style.display = 'none';
      initialButtons.style.display = 'none';
      cropControls.style.display = 'block';

      // Dynamic import of cropperjs + its CSS
      const [{ default: Cropper }] = await Promise.all([
        import('cropperjs'),
        import('cropperjs/dist/cropper.css'),
      ]);

      cropperInstance = new Cropper(cropImg, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        cropBoxResizable: true,
        cropBoxMovable: true,
        guides: false,
        center: true,
        background: false,
      });
    };
    reader.readAsDataURL(file);
  });

  // Cancel crop
  dialog.querySelector('#photo-crop-cancel')?.addEventListener('click', () => {
    cropperInstance?.destroy();
    cropperInstance = null;
    cropControls.style.display = 'none';
    cropArea.style.display = '';
    initialButtons.style.display = 'flex';
  });

  // Confirm crop
  dialog.querySelector('#photo-crop-confirm')?.addEventListener('click', () => {
    if (!cropperInstance) return;

    const cropData = cropperInstance.getData(true);
    const img = new Image();
    img.onload = () => {
      const dataUrl = cropImageWithCanvas(img, cropData);
      saveDogPhoto(dataUrl);
      onSave(dataUrl);
      cropperInstance?.destroy();
      dialog.close();
    };
    img.src = cropImg.src;
  });

  // Cleanup on close
  dialog.addEventListener('close', () => {
    cropperInstance?.destroy();
    dialog.remove();
  });
}
