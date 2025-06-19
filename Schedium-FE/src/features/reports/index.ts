/**
 * Reports Feature Export - Comprehensive report generation system
 * Advanced report builder with drag & drop interface, templates, and export options
 */

// Main hook
export { useReportBuilder } from './hooks/useReportBuilder'
export type {
  ReportField,
  ReportVisualization,
  ReportFilter,
  ReportTemplate,
  ReportExecution
} from './hooks/useReportBuilder'

// Main components
export { default as ReportBuilder } from './components/ReportBuilder/ReportBuilder'
export { default as ReportQueue } from './components/ReportQueue/ReportQueue'
export { default as TemplateLibrary } from './components/TemplateLibrary/TemplateLibrary'
export { default as ExportConfiguration } from './components/ExportConfiguration/ExportConfiguration'

// Re-export component props for external usage
export type { default as ReportBuilderProps } from './components/ReportBuilder/ReportBuilder'