export type IssueType =
  | 'hardcoded-secret'
  | 'env-tracked'
  | 'env-not-gitignored'
  | 'hallucinated-package'
  | 'frontend-secret'

export interface Issue {
  type: IssueType
  file: string
  line?: number
  message: string
  fix?: string
}
