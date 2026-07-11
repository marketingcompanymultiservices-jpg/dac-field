import { supabaseClient } from "@/lib/supabaseClient";
import type { DocumentStatus, ProjectDocument } from "@/types";

export const DOCUMENTS_BUCKET = "documents";

type DocumentRow = {
  id: string;
  project_id: string;
  name: string;
  folder: string;
  version: number;
  status: DocumentStatus;
  upload_date: string;
  expiration_date: string | null;
  uploaded_by: string;
  uploaded_by_email: string | null;
  observation: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  public_url: string | null;
};

type UploadProjectDocumentInput = {
  projectId: string;
  name: string;
  folder: string;
  version: number;
  status: DocumentStatus;
  uploadDate: string;
  expirationDate?: string;
  uploadedBy: string;
  uploadedByEmail?: string;
  observation: string;
  file: File;
};

export async function loadProjectDocumentsFromSupabase(projectId: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data, error } = await supabaseClient
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("upload_date", { ascending: false });

  if (error) throw buildDocumentError("No fue posible cargar documentos desde Supabase.", error);
  return ((data ?? []) as DocumentRow[]).map(mapDocumentRow);
}

export async function uploadProjectDocumentToSupabase(input: UploadProjectDocumentInput) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data: userData } = await supabaseClient.auth.getUser();
  const authenticatedUser = userData.user?.email ?? input.uploadedByEmail ?? input.uploadedBy;
  const safeFileName = sanitizeFileName(input.file.name);
  const storagePath = [
    input.projectId,
    input.folder,
    Date.now() + "-" + safeFileName
  ].join("/");
  const uploadContext = {
    bucket: DOCUMENTS_BUCKET,
    storagePath,
    fileName: input.file.name,
    projectId: input.projectId,
    authenticatedUser
  };

  console.info("[DAC Documents] Bucket utilizado para carga documental", uploadContext);

  const bucketDiagnostic = await inspectDocumentsBucket(DOCUMENTS_BUCKET);
  console.info("[DAC Documents] Diagnostico Supabase Storage", {
    ...uploadContext,
    bucketDiagnostic
  });

  if (bucketDiagnostic.status === "missing") {
    throw new Error(
      "El bucket requerido para documentos no existe en Supabase Storage. Debe existir: " +
        DOCUMENTS_BUCKET +
        ". Buckets disponibles: " +
        (bucketDiagnostic.availableBuckets.length > 0 ? bucketDiagnostic.availableBuckets.join(", ") : "sin acceso o sin buckets visibles") +
        "."
    );
  }

  const uploadResponse = await supabaseClient.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: input.file.type || undefined
    });

  console.info("[DAC Documents] Respuesta completa de Supabase Storage", {
    ...uploadContext,
    response: uploadResponse
  });

  if (uploadResponse.error) throw buildDocumentError("No fue posible subir el archivo a Supabase Storage.", uploadResponse.error, uploadContext);

  const { data: publicData } = supabaseClient.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath);

  const payload = {
    project_id: input.projectId,
    name: input.name,
    folder: input.folder,
    version: input.version,
    status: input.status,
    upload_date: input.uploadDate,
    expiration_date: input.expirationDate ?? null,
    uploaded_by: input.uploadedBy,
    uploaded_by_email: input.uploadedByEmail ?? null,
    observation: input.observation,
    file_name: input.file.name,
    file_type: input.file.type || null,
    file_size: input.file.size,
    storage_path: storagePath,
    public_url: publicData.publicUrl
  };

  const { data, error: metadataError } = await supabaseClient
    .from("project_documents")
    .insert(payload)
    .select("*")
    .single();

  if (metadataError) throw buildDocumentError("El archivo subio, pero no fue posible guardar metadatos del documento.", metadataError, uploadContext);

  return mapDocumentRow(data as DocumentRow);
}

export async function createProjectDocumentDownloadUrl(document: ProjectDocument) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  if (!document.storagePath) throw new Error("El documento no tiene ruta de almacenamiento.");

  const { data, error } = await supabaseClient.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.storagePath, 60);

  if (error) throw buildDocumentError("No fue posible crear enlace de descarga.", error, {
    bucket: DOCUMENTS_BUCKET,
    storagePath: document.storagePath,
    fileName: document.fileName ?? document.name,
    projectId: document.projectId ?? "",
    authenticatedUser: document.uploadedBy ?? document.user
  });
  return data.signedUrl;
}

export async function deleteProjectDocumentFromSupabase(document: ProjectDocument) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  if (!document.storagePath) throw new Error("El documento no tiene ruta de almacenamiento.");

  const { data: userData } = await supabaseClient.auth.getUser();
  const deleteContext = {
    bucket: DOCUMENTS_BUCKET,
    storagePath: document.storagePath,
    fileName: document.fileName ?? document.name,
    projectId: document.projectId ?? "",
    authenticatedUser: userData.user?.email ?? document.uploadedBy ?? document.user
  };

  console.info("[DAC Documents] Eliminando documento de Supabase Storage", deleteContext);

  const storageResponse = await supabaseClient.storage
    .from(DOCUMENTS_BUCKET)
    .remove([document.storagePath]);

  console.info("[DAC Documents] Respuesta completa de eliminacion en Supabase Storage", {
    ...deleteContext,
    response: storageResponse
  });

  if (storageResponse.error) throw buildDocumentError("No fue posible eliminar el archivo en Supabase Storage.", storageResponse.error, deleteContext);

  const { error: metadataError } = await supabaseClient
    .from("project_documents")
    .delete()
    .eq("id", document.id);

  if (metadataError) throw buildDocumentError("El archivo fue eliminado, pero no fue posible eliminar los metadatos del documento.", metadataError, deleteContext);
}

async function inspectDocumentsBucket(bucketName: string) {
  if (!supabaseClient) return { status: "unavailable" as const, availableBuckets: [], error: "Supabase no esta configurado." };

  const { data, error } = await supabaseClient.storage.listBuckets();
  const availableBuckets = (data ?? []).map((bucket) => bucket.name || bucket.id).filter(Boolean);

  if (error) {
    return {
      status: "unknown" as const,
      availableBuckets,
      error: {
        message: error.message,
        name: error.name
      }
    };
  }

  return {
    status: availableBuckets.includes(bucketName) ? ("found" as const) : ("missing" as const),
    availableBuckets,
    error: null
  };
}

function mapDocumentRow(row: DocumentRow): ProjectDocument {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    folder: row.folder,
    version: Number(row.version) || 1,
    status: row.status,
    uploadDate: row.upload_date,
    expirationDate: row.expiration_date ?? undefined,
    user: row.uploaded_by,
    observation: row.observation,
    simulatedFile: row.file_name,
    fileName: row.file_name,
    fileType: row.file_type ?? undefined,
    fileSize: row.file_size ?? undefined,
    storagePath: row.storage_path,
    publicUrl: row.public_url ?? undefined,
    uploadedBy: row.uploaded_by_email ?? undefined
  };
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function buildDocumentError(message: string, error: unknown, context?: Record<string, unknown>) {
  const typed = error as { message?: string; statusCode?: string; error?: string; code?: string; details?: string; hint?: string };
  console.error("[DAC Documents] " + message, {
    context,
    code: typed.code,
    statusCode: typed.statusCode,
    message: typed.message,
    details: typed.details,
    hint: typed.hint,
    error: typed.error
  });
  return new Error(
    [
      message,
      typed.message,
      typed.details,
      typed.hint
    ].filter(Boolean).join(" ")
  );
}
