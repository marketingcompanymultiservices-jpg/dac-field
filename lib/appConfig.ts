export const appConfig = {
  systemName: "Doble Altura Control",
  productName: "DAC Field",
  version: "v1.0.0",
  company: "Doble Altura Construcciones S.A.S.",
  environment: "Produccion",
  buildDate: "2026-07-09",
  author: "Doble Altura Construcciones S.A.S.",
  credits: "Proyecto DAC - Sistema Integral de Gestion de Obras preparado para operacion en campo y control ejecutivo."
};

export function getVersionLabel() {
  return appConfig.productName + " " + appConfig.version;
}
