// 題目類型
export type QuestionType = 'text' | 'choice' | 'radio' | 'checkbox';

// 題目介面
export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[];
  required: boolean;
}

// 問卷介面
export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  // published 表示問卷是否已發佈
  published: boolean;
  // 問卷的開始與結束時間（可為 null，表示無限制）
  startAt?: Date | null;
  endAt?: Date | null;
  // 快速判斷是否在進行中（已發佈且在 startAt/endAt 範圍內）
  isActive: boolean;
}

// 問卷回應
export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  responses: { [questionId: string]: string | string[] };
  submittedAt: Date;
}

// 用戶介面
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}
