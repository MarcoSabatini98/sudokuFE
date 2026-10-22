import { HttpParams } from '@angular/common/http';

/** Costruisce HttpParams da un oggetto di filtri, saltando i valori nulli/undefined. */
export function toHttpParams(filters: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params = params.set(key, String(value));
  });
  return params;
}
