/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PipelineStep = 'idle' | 'extracting' | 'transforming' | 'loading' | 'analyzing' | 'notifying' | 'completed' | 'error';

export interface DataRecord {
  id: string;
  status: 'raw' | 'cleaned' | 'transformed';
  [key: string]: any;
}

export interface ColumnMetadata {
  key: string;
  type: 'numeric' | 'categorical' | 'date' | 'string';
}

export interface PipelineConfig {
  sourceType: 'csv' | 'azure_sql';
  destinationType: 'sqlite' | 'azure_blob';
  sendEmail: boolean;
  autoSchedule: boolean;
}

export interface PipelineStats {
  rowsProcessed: number;
  errorsCaught: number;
  durationSeconds: number;
  lastRun: string | null;
}

