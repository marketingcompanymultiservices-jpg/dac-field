import { supabaseClient } from "@/lib/supabaseClient";

const DAILY_REPORT_PHOTOS_BUCKET = "daily-report-photos";

type SupabaseOperationError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type UploadedDailyReportPhoto = {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

export async function uploadDailyReportPhotoToStorage(input: {
  projectId: string;
  reportId: string;
  photoId: string;
  fileName: string;
  mimeType?: string;
  dataUrl: string;
}): Promise<UploadedDailyReportPhoto> {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const blob = dataUrlToBlob(input.dataUrl, input.mimeType);
  const mimeType = input.mimeType || blob.type || "image/jpeg";
  const storagePath = [
    "daily-reports",
    sanitizePathSegment(input.projectId),
    sanitizePathSegment(input.reportId),
    sanitizePathSegment(input.photoId) + "-" + sanitizeFileName(input.fileName)
  ].join("/");

  const { data, error } = await supabaseClient.storage.from(DAILY_REPORT_PHOTOS_BUCKET).upload(storagePath, blob, {
    contentType: mimeType,
    upsert: false
  });

  if (error) {
    throw buildDailyReportPhotoOperationError("No fue posible subir la fotografia a Supabase Storage", {
      code: error.name,
      message: error.message,
      details: JSON.stringify({ bucket: DAILY_REPORT_PHOTOS_BUCKET, storagePath, projectId: input.projectId, reportId: input.reportId }),
      hint: "Verifica el bucket daily-report-photos y sus politicas de Storage."
    });
  }

  return {
    storagePath: data?.path ?? storagePath,
    mimeType,
    sizeBytes: blob.size
  };
}

export async function removeDailyReportPhotosFromStorage(storagePaths: string[]) {
  if (!supabaseClient || storagePaths.length === 0) return;
  const { error } = await supabaseClient.storage.from(DAILY_REPORT_PHOTOS_BUCKET).remove(storagePaths);
  if (error) {
    console.error("[DAC DailyReports] No fue posible limpiar fotografias subidas despues de una falla", {
      bucket: DAILY_REPORT_PHOTOS_BUCKET,
      storagePaths,
      message: error.message,
      name: error.name
    });
  }
}

export async function createDailyReportPhotoSignedUrl(storagePath: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  const { data, error } = await supabaseClient.storage.from(DAILY_REPORT_PHOTOS_BUCKET).createSignedUrl(storagePath, 60 * 60);
  if (error) {
    throw buildDailyReportPhotoOperationError("No fue posible generar URL firmada para la fotografia", {
      code: error.name,
      message: error.message,
      details: JSON.stringify({ bucket: DAILY_REPORT_PHOTOS_BUCKET, storagePath }),
      hint: "Verifica permisos SELECT del bucket daily-report-photos."
    });
  }
  return data.signedUrl;
}

function dataUrlToBlob(dataUrl: string, fallbackType?: string) {
  const [header, base64Payload] = dataUrl.split(",");
  if (!base64Payload) throw new Error("La fotografia no tiene datos validos para subir a Storage.");
  const mimeMatch = header.match(/data:([^;]+);base64/i);
  const mimeType = mimeMatch?.[1] || fallbackType || "image/jpeg";
  const binary = window.atob(base64Payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._=-]/g, "-");
}

function sanitizeFileName(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const safeName = normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return safeName || "fotografia.jpg";
}

function buildDailyReportPhotoOperationError(message: string, error: SupabaseOperationError) {
  const fullMessage = [
    message,
    "code: " + (error.code ?? "sin codigo"),
    "message: " + (error.message ?? "sin mensaje"),
    "details: " + (error.details ?? "sin detalles"),
    "hint: " + (error.hint ?? "sin sugerencia")
  ].join(" | ");

  console.error("[DAC DailyReports] " + message, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });

  return new Error(fullMessage);
}
