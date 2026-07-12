import * as XLSX from "xlsx";
import type { BudgetItem } from "@/types";

export type ParsedBudgetRow = {
  rowNumber: number;
  item: string;
  importOrder: number;
  description: string;
  unit: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  executedQuantity: number;
  executedValue: number;
  pendingQuantity: number;
  pendingValue: number;
  initialProgress: number;
  chapter: string;
  subchapter: string;
};

export type DuplicateBudgetItem = {
  item: string;
  description: string;
  rowNumber: number;
  chapter: string;
  subchapter: string;
};

export type DiscardedBudgetRow = {
  rowNumber: number;
  item: string;
  description: string;
  reason: DiscardReason;
};

export type DiscardReason =
  | "Fila vacia"
  | "Falta unidad"
  | "Falta cantidad"
  | "Falta valor unitario"
  | "Falta valor total"
  | "Es capitulo"
  | "Es subcapitulo"
  | "Es subtotal"
  | "Es total general"
  | "Valor invalido";

export type BudgetValidationSummary = {
  fileName: string;
  rowsRead: number;
  validActivities: number;
  chaptersDetected: number;
  subchaptersDetected: number;
  extraWorksDetected: number;
  discardedRows: number;
  totalBudgetValue: number;
  requiredColumns: Array<keyof ColumnMap>;
  detectedColumns: Array<keyof ColumnMap>;
  missingColumns: Array<keyof ColumnMap>;
};

export type ParsedBudgetExcel = {
  fileName: string;
  activities: BudgetItem[];
  validRows: ParsedBudgetRow[];
  duplicateItems: DuplicateBudgetItem[];
  discardedRows: DiscardedBudgetRow[];
  summary: BudgetValidationSummary;
  warnings: string[];
  canImportWithAutoResolution: boolean;
  canImport: boolean;
};

type ColumnMap = {
  item: number;
  description: number;
  unit: number;
  quantity: number;
  totalValue: number;
  unitValue?: number;
  executedQuantity?: number;
  executedValue?: number;
  pendingQuantity?: number;
  pendingValue?: number;
  progress?: number;
};

type RawRow = Array<string | number | boolean | Date | null | undefined>;

const requiredColumns: Array<keyof ColumnMap> = ["item", "description", "unit", "quantity", "totalValue"];

const officialBudgetColumnMap: ColumnMap = {
  item: 0,
  description: 1,
  unit: 2,
  quantity: 3,
  unitValue: 4,
  totalValue: 5,
  executedQuantity: 7,
  executedValue: 8,
  pendingQuantity: 10,
  pendingValue: 11
};

const headerAliases: Record<keyof ColumnMap, string[]> = {
  item: ["item", "itm"],
  description: ["descripcion", "description", "detalle", "actividad", "concepto"],
  unit: ["und", "und.", "unidad", "unid", "un"],
  quantity: ["cant", "cant.", "cantidad", "qty"],
  unitValue: ["valor unit", "valor unit.", "valor unitario", "vlr unit", "vr unit", "precio unitario"],
  totalValue: ["valor total", "total", "vlr total", "vr total", "valor parcial"],
  executedQuantity: ["cantidad ejecutada", "cant ejecutada", "cant. ejecutada", "ejecutado", "ejecutado acumulado", "cantidad ejecutada acumulada"],
  executedValue: ["valor ejecutado", "vlr ejecutado", "vr ejecutado", "ejecutado valor"],
  pendingQuantity: ["cantidad por ejecutar", "cant por ejecutar", "cant. por ejecutar", "saldo", "cantidad pendiente", "pendiente"],
  pendingValue: ["valor por ejecutar", "vlr por ejecutar", "vr por ejecutar", "valor pendiente", "saldo valor"],
  progress: ["%", "porcentaje", "avance", "% avance", "porcentaje avance"]
};

const totalPatterns = [
  "subtotal",
  "total",
  "costo directo",
  "administracion",
  "imprevistos",
  "utilidad",
  "iva",
  "aiu",
  "costos de obra"
];

export async function parseBudgetExcel(file: File): Promise<ParsedBudgetExcel> {
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    throw new Error("El archivo seleccionado no es Excel. Usa un archivo .xlsx o .xls.");
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("El archivo no contiene hojas para leer.");

  const rows = XLSX.utils.sheet_to_json<RawRow>(workbook.Sheets[firstSheetName], { header: 1, defval: "" });
  const detected = detectHeaderRow(rows);
  if (!detected) {
    throw new Error("No se detectaron columnas minimas: ITEM, DESCRIPCION, UND, CANTIDAD y VALOR TOTAL.");
  }

  const detectedColumns = Object.keys(detected.columns) as Array<keyof ColumnMap>;
  const missingColumns = requiredColumns.filter((column) => detected.columns[column] === undefined);
  if (missingColumns.length > 0) {
    throw new Error("No se detectan columnas obligatorias: " + missingColumns.map(formatColumnName).join(", ") + ".");
  }

  const detectedRows = detectBudgetRows(rows.slice(detected.headerIndex + 1), detected.columns as ColumnMap, detected.headerIndex + 2);
  const duplicateItems = detectDuplicateItems(detectedRows.validRows);
  const activities = detectedRows.validRows.map((row, index) => ({
    id: "budget-" + row.item + "-" + row.importOrder,
    item: row.item,
    importOrder: row.importOrder,
    description: row.description,
    unit: row.unit,
    quantity: row.quantity,
    unitValue: row.unitValue,
    totalValue: row.totalValue,
    executedQuantity: row.executedQuantity,
    executedValue: row.executedValue,
    pendingQuantity: row.pendingQuantity,
    pendingValue: row.pendingValue,
    budgetType: row.item.toUpperCase().trim().startsWith("OE") ? "Obra Extra" : "Presupuesto Base",
    chapter: row.chapter,
    subchapter: row.subchapter,
    initialProgress: row.initialProgress
  }));

  const totalBudgetValue = activities.reduce((sum, item) => sum + item.totalValue, 0);
  const summary: BudgetValidationSummary = {
    fileName: file.name,
    rowsRead: Math.max(rows.length - detected.headerIndex - 1, 0),
    validActivities: activities.length,
    chaptersDetected: detectedRows.chapters.size,
    subchaptersDetected: detectedRows.subchapters.size,
    extraWorksDetected: activities.filter((item) => item.budgetType === "Obra Extra").length,
    discardedRows: detectedRows.discardedRows.length,
    totalBudgetValue,
    requiredColumns,
    detectedColumns,
    missingColumns
  };

  const warnings = [...detectedRows.warnings];
  if (activities.length === 0) warnings.push("No hay actividades validas para importar.");
  if (totalBudgetValue === 0) warnings.push("El valor total detectado es 0.");
  if (duplicateItems.length > 0) {
    warnings.push("Se detectaron " + duplicateItems.length + " actividades con ITEM duplicado. Usa la resolucion automatica antes de importar.");
  }

  const canImportWithAutoResolution = activities.length > 0 && totalBudgetValue > 0 && missingColumns.length === 0;

  return {
    fileName: file.name,
    activities,
    validRows: detectedRows.validRows,
    duplicateItems,
    discardedRows: detectedRows.discardedRows,
    summary,
    warnings,
    canImportWithAutoResolution,
    canImport: canImportWithAutoResolution && duplicateItems.length === 0
  };
}

export function normalizeHeader(header: unknown) {
  return normalizeText(header);
}

export function parseCurrency(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const cleaned = text.replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const cleaned = text.replace(/\s/g, "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function detectBudgetRows(rows: RawRow[], columns: ColumnMap, firstRowNumber = 1) {
  let chapter = "Sin capitulo";
  let subchapter = "Sin subcapitulo";
  const validRows: ParsedBudgetRow[] = [];
  const discardedRows: DiscardedBudgetRow[] = [];
  const warnings: string[] = [];
  const chapters = new Set<string>();
  const subchapters = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = firstRowNumber + index;
    const item = getCell(row, columns.item);
    const description = getCell(row, columns.description);

    if (isEmptyRow(row)) {
      discardedRows.push({ rowNumber, item, description, reason: "Fila vacia" });
      return;
    }

    const unit = getCell(row, columns.unit);
    const quantity = parseNumber(row[columns.quantity]);
    const unitValue = columns.unitValue === undefined ? 0 : parseCurrency(row[columns.unitValue]);
    const totalValue = parseCurrency(row[columns.totalValue]);
    const executedQuantity = columns.executedQuantity === undefined ? 0 : parseNumber(row[columns.executedQuantity]);
    const executedValue = columns.executedValue === undefined ? 0 : parseCurrency(row[columns.executedValue]);
    const pendingQuantity = columns.pendingQuantity === undefined ? Math.max(quantity - executedQuantity, 0) : parseNumber(row[columns.pendingQuantity]);
    const pendingValue = columns.pendingValue === undefined ? Math.max(totalValue - executedValue, 0) : parseCurrency(row[columns.pendingValue]);
    const initialProgress = columns.progress === undefined ? 0 : parseProgress(row[columns.progress]);
    const itemDescriptionText = normalizeText([item, description].join(" "));

    if ([quantity, unitValue, totalValue, executedQuantity, executedValue, pendingQuantity, pendingValue, initialProgress].some((value) => Number.isNaN(value))) {
      if (isSubtotalLike(itemDescriptionText)) {
        discardedRows.push({ rowNumber, item, description, reason: itemDescriptionText.includes("subtotal") ? "Es subtotal" : "Es total general" });
        return;
      }

      discardedRows.push({ rowNumber, item, description, reason: "Valor invalido" });
      warnings.push("Fila " + rowNumber + ": contiene valores numericos invalidos.");
      return;
    }

    const hasDescription = Boolean(description);
    const hasQuantity = quantity > 0;
    const hasUnit = Boolean(unit);
    const hasUnitValue = unitValue > 0;
    const hasTotalValue = totalValue > 0;
    const itemText = item || String(rowNumber);
    const hasCompleteActivity = Boolean(item) && hasDescription && hasUnit && hasQuantity && hasUnitValue && hasTotalValue;

    if (!hasCompleteActivity && isSubtotalLike(itemDescriptionText)) {
      discardedRows.push({ rowNumber, item, description, reason: itemDescriptionText.includes("subtotal") ? "Es subtotal" : "Es total general" });
      return;
    }

    if (!hasUnit && !hasQuantity && hasDescription) {
      if (/^\d+$/.test(itemText)) {
        chapter = description;
        subchapter = "Sin subcapitulo";
        chapters.add(chapter);
        discardedRows.push({ rowNumber, item, description, reason: "Es capitulo" });
        return;
      }

      if (/^\d+([.,]\d+)+$/.test(itemText)) {
        subchapter = description;
        subchapters.add(subchapter);
        discardedRows.push({ rowNumber, item, description, reason: "Es subcapitulo" });
        return;
      }
    }

    if (!hasUnit) {
      discardedRows.push({ rowNumber, item, description, reason: "Falta unidad" });
      return;
    }

    if (!hasQuantity) {
      discardedRows.push({ rowNumber, item, description, reason: "Falta cantidad" });
      return;
    }

    if (!hasUnitValue) {
      discardedRows.push({ rowNumber, item, description, reason: "Falta valor unitario" });
      return;
    }

    if (!hasTotalValue) {
      discardedRows.push({ rowNumber, item, description, reason: "Falta valor total" });
      return;
    }

    validRows.push({
      rowNumber,
      item: itemText,
      importOrder: validRows.length + 1,
      description,
      unit,
      quantity,
      unitValue,
      totalValue,
      executedQuantity,
      executedValue,
      pendingQuantity,
      pendingValue,
      initialProgress,
      chapter,
      subchapter
    });
  });

  return { validRows, discardedRows, warnings, chapters, subchapters };
}

function detectDuplicateItems(rows: ParsedBudgetRow[]) {
  const byItem = new Map<string, ParsedBudgetRow[]>();
  rows.forEach((row) => {
    const key = normalizeText(row.item);
    byItem.set(key, [...(byItem.get(key) ?? []), row]);
  });

  return Array.from(byItem.values())
    .filter((group) => group.length > 1)
    .flatMap((group) =>
      group.map((row) => ({
        item: row.item,
        description: row.description,
        rowNumber: row.rowNumber,
        chapter: row.chapter,
        subchapter: row.subchapter
      }))
    );
}

function detectHeaderRow(rows: RawRow[]) {
  for (let index = 0; index < Math.min(rows.length, 25); index += 1) {
    const columns = detectColumns(rows[index]);
    const hasMinimum = requiredColumns.every((column) => columns[column] !== undefined);
    if (hasMinimum || (columns.item !== undefined && columns.description !== undefined)) {
      return { headerIndex: index, columns };
    }
  }

  return null;
}

function detectColumns(row: RawRow) {
  const columns: Partial<ColumnMap> = {};

  row.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    (Object.keys(headerAliases) as Array<keyof ColumnMap>).forEach((key) => {
      if (columns[key] !== undefined) return;
      if (headerAliases[key].some((alias) => normalized === normalizeHeader(alias))) {
        columns[key] = index;
      }
    });
  });

  if (isOfficialBudgetHeader(row, columns)) {
    return officialBudgetColumnMap;
  }

  return columns;
}

function isOfficialBudgetHeader(row: RawRow, columns: Partial<ColumnMap>) {
  const normalizedCells = row.map((cell) => normalizeHeader(cell));
  const hasBaseColumns = columns.item === 0 && columns.description === 1 && columns.unit === 2;
  const hasExpectedPositions =
    normalizedCells[3] === "cant." ||
    normalizedCells[3] === "cant" ||
    normalizedCells[3] === "cantidad";
  const hasRepeatedExecutionBlock =
    normalizedCells[7] === "cant." ||
    normalizedCells[7] === "cant" ||
    normalizedCells[7] === "cantidad" ||
    normalizedCells[8] === "valor total";
  const hasRepeatedPendingBlock =
    normalizedCells[10] === "cant." ||
    normalizedCells[10] === "cant" ||
    normalizedCells[10] === "cantidad" ||
    normalizedCells[11] === "valor total";

  return hasBaseColumns && hasExpectedPositions && hasRepeatedExecutionBlock && hasRepeatedPendingBlock;
}

function getCell(row: RawRow, index: number) {
  return String(row[index] ?? "").trim();
}

function parseProgress(value: unknown) {
  const parsed = parseNumber(value);
  if (Number.isNaN(parsed)) return Number.NaN;
  const normalized = parsed > 1 ? parsed : parsed * 100;
  return Math.min(Math.max(normalized, 0), 100);
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isEmptyRow(row: RawRow) {
  return row.every((cell) => String(cell ?? "").trim() === "");
}

function isSubtotalLike(text: string) {
  return totalPatterns.some((pattern) => text.includes(pattern));
}

function formatColumnName(column: keyof ColumnMap) {
  const names: Record<keyof ColumnMap, string> = {
    item: "ITEM",
    description: "DESCRIPCION",
    unit: "UND",
    quantity: "CANTIDAD",
    unitValue: "VALOR UNITARIO",
    totalValue: "VALOR TOTAL",
    executedQuantity: "CANTIDAD EJECUTADA",
    executedValue: "VALOR EJECUTADO",
    pendingQuantity: "CANTIDAD POR EJECUTAR",
    pendingValue: "VALOR POR EJECUTAR",
    progress: "AVANCE"
  };
  return names[column];
}
