import type { DailyPhoto } from "@/types";

const DB_NAME = "dac-image-storage";
const STORE_NAME = "daily-report-images";
const DB_VERSION = 1;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type ImageRecord = {
  id: string;
  dataUrl: string;
  type: string;
  updatedAt: string;
};

export type ImageMetadataInput = {
  projectId: string;
  date: string;
  time: string;
  user: string;
  description?: string;
  activityId?: string;
  reportId?: string;
  dailyReportId?: string;
  inspectionId?: string;
  inspectionPhotoType?: "observacion" | "correccion";
};

export function validateImageFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    return "Formato no permitido. Usa JPG, JPEG, PNG o WEBP.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "La imagen supera 5 MB. Intenta con una imagen mas liviana.";
  }

  return "";
}

export async function saveImage(file: File, metadata: ImageMetadataInput): Promise<DailyPhoto> {
  const validation = validateImageFile(file);
  if (validation) throw new Error(validation);

  const dataUrl = await compressImage(file);
  const id = "photo-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  const db = await openImageDb();

  await putRecord(db, {
    id,
    dataUrl,
    type: file.type,
    updatedAt: new Date().toISOString()
  });

  return {
    id,
    projectId: metadata.projectId,
    name: file.name,
    date: metadata.date,
    time: metadata.time,
    user: metadata.user,
    description: metadata.description ?? "",
    activityId: metadata.activityId,
    reportId: metadata.reportId,
    dailyReportId: metadata.dailyReportId ?? metadata.reportId,
    inspectionId: metadata.inspectionId,
    inspectionPhotoType: metadata.inspectionPhotoType,
    type: file.type,
    size: file.size,
    storage: "indexedDB"
  };
}

export async function getImage(id: string) {
  const db = await openImageDb();
  const record = await getRecord(db, id);
  return record?.dataUrl ?? "";
}

export async function getImagesByReportId(reportId: string, photos: DailyPhoto[]) {
  return hydratePhotos(photos.filter((photo) => photo.reportId === reportId || photo.dailyReportId === reportId));
}

export async function getImagesByDailyReportId(dailyReportId: string, photos: DailyPhoto[]) {
  return getImagesByReportId(dailyReportId, photos);
}

export async function getImagesByActivityId(activityId: string, photos: DailyPhoto[]) {
  return hydratePhotos(photos.filter((photo) => photo.activityId === activityId));
}

export async function getImagesByDate(date: string, photos: DailyPhoto[]) {
  return hydratePhotos(photos.filter((photo) => photo.date === date));
}

export async function deleteImage(id: string) {
  const db = await openImageDb();
  await deleteRecord(db, id);
}

export async function clearImages() {
  const db = await openImageDb();
  await clearStore(db);
}

export async function compressImage(file: File) {
  if (file.type === "image/gif") return fileToDataUrl(file);
  const sourceDataUrl = await fileToDataUrl(file);

  if (typeof document === "undefined") return sourceDataUrl;

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxWidth = 1600;
      const scale = image.width > maxWidth ? maxWidth / image.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(sourceDataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.82));
    };
    image.onerror = () => resolve(sourceDataUrl);
    image.src = sourceDataUrl;
  });
}

export const compressImageIfPossible = compressImage;

async function hydratePhotos(photos: DailyPhoto[]) {
  const entries = await Promise.all(
    photos.map(async (photo) => {
      try {
        return { photo, dataUrl: photo.imageData || (await getImage(photo.id)) };
      } catch (error) {
        console.error("[DAC ImageStorage] No fue posible hidratar fotografia", {
          file: "lib/imageStorage.ts",
          function: "hydratePhotos",
          line: "ver sourcemap/build",
          photoId: photo.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return { photo, dataUrl: "" };
      }
    })
  );
  return entries.filter((entry) => entry.dataUrl);
}

function openImageDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no esta disponible en este navegador."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No fue posible abrir IndexedDB."));
  });
}

function putRecord(db: IDBDatabase, record: ImageRecord) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("No fue posible guardar la imagen."));
  });
}

function getRecord(db: IDBDatabase, id: string) {
  return new Promise<ImageRecord | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as ImageRecord | undefined);
    request.onerror = () => reject(request.error ?? new Error("No fue posible leer la imagen."));
  });
}

function deleteRecord(db: IDBDatabase, id: string) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("No fue posible eliminar la imagen."));
  });
}

function clearStore(db: IDBDatabase) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("No fue posible limpiar las imagenes."));
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("No fue posible leer la imagen."));
    reader.readAsDataURL(file);
  });
}
