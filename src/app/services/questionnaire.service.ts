import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Questionnaire, QuestionnaireResponse, Question } from '../models/questionnaire.models';

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {
  private questionnaires: Questionnaire[] = [];
  private responses: QuestionnaireResponse[] = [];

  private questionnairesSubject = new BehaviorSubject<Questionnaire[]>([]);
  public questionnaires$ = this.questionnairesSubject.asObservable();

  constructor() {
    // 載入本地儲存的資料
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedQuestionnaires = localStorage.getItem('questionnaires');
      const storedResponses = localStorage.getItem('questionnaireResponses');

      if (storedQuestionnaires) {
        this.questionnaires = JSON.parse(storedQuestionnaires).map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt),
          startAt: q.startAt ? new Date(q.startAt) : null,
          endAt: q.endAt ? new Date(q.endAt) : null,
          published: !!q.published,
          isActive: !!q.isActive
        }));
      }

      if (storedResponses) {
        this.responses = JSON.parse(storedResponses).map((r: any) => ({
          ...r,
          submittedAt: new Date(r.submittedAt)
        }));
      }

      this.questionnairesSubject.next(this.questionnaires);
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('questionnaires', JSON.stringify(this.questionnaires));
      localStorage.setItem('questionnaireResponses', JSON.stringify(this.responses));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  }

  // 獲取所有問卷
  getAllQuestionnaires(): Questionnaire[] {
    return this.questionnaires;
  }

  // 獲取單一問卷
  getQuestionnaire(id: string): Questionnaire | undefined {
    return this.questionnaires.find(q => q.id === id);
  }

  // 創建新問卷
  createQuestionnaire(questionnaire: Omit<Questionnaire, 'id' | 'createdAt' | 'updatedAt'>): Questionnaire {
    const newQuestionnaire: Questionnaire = {
      ...questionnaire,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      published: questionnaire.published ?? false,
      startAt: questionnaire.startAt ?? null,
      endAt: questionnaire.endAt ?? null,
      isActive: questionnaire.isActive ?? false
    };

    this.questionnaires.push(newQuestionnaire);
    this.questionnairesSubject.next(this.questionnaires);
    this.saveToStorage();

    return newQuestionnaire;
  }

  // 更新問卷
  updateQuestionnaire(id: string, updates: Partial<Questionnaire>): Questionnaire | undefined {
    const index = this.questionnaires.findIndex(q => q.id === id);
    if (index === -1) return undefined;

    this.questionnaires[index] = {
      ...this.questionnaires[index],
      ...this.questionnaires[index],
      ...updates,
      // ensure date fields are preserved or converted
      startAt: updates.startAt !== undefined ? (updates.startAt ? new Date(updates.startAt as any) : null) : this.questionnaires[index].startAt,
      endAt: updates.endAt !== undefined ? (updates.endAt ? new Date(updates.endAt as any) : null) : this.questionnaires[index].endAt,
      published: updates.published !== undefined ? !!updates.published : this.questionnaires[index].published,
      isActive: updates.isActive !== undefined ? !!updates.isActive : this.questionnaires[index].isActive,
      updatedAt: new Date()
    };

    this.questionnairesSubject.next(this.questionnaires);
    this.saveToStorage();

    return this.questionnaires[index];
  }

  // 刪除問卷
  deleteQuestionnaire(id: string): boolean {
    const index = this.questionnaires.findIndex(q => q.id === id);
    if (index === -1) return false;

    this.questionnaires.splice(index, 1);
    this.responses = this.responses.filter(r => r.questionnaireId !== id);

    this.questionnairesSubject.next(this.questionnaires);
    this.saveToStorage();

    return true;
  }

  // 提交問卷回應
  submitResponse(questionnaireId: string, responses: { [questionId: string]: string | string[] }): QuestionnaireResponse {
    const newResponse: QuestionnaireResponse = {
      id: this.generateId(),
      questionnaireId,
      responses,
      submittedAt: new Date()
    };

    this.responses.push(newResponse);
    this.saveToStorage();

    return newResponse;
  }

  // 獲取問卷的所有回應
  getResponsesByQuestionnaire(questionnaireId: string): QuestionnaireResponse[] {
    return this.responses.filter(r => r.questionnaireId === questionnaireId);
  }

  // 檢查問卷是否已填寫過（簡單的本地檢查）
  hasResponded(questionnaireId: string): boolean {
    // 這裡使用簡單的檢查，實際應用可能需要用戶認證
    const responded = localStorage.getItem(`responded_${questionnaireId}`);
    return responded === 'true';
  }

  setResponded(questionnaireId: string): void {
    localStorage.setItem(`responded_${questionnaireId}`, 'true');
  }

  // 獲取問卷統計資訊
  getQuestionnaireStats(questionnaireId: string): { totalResponses: number; recentResponses: number } {
    const questionnaireResponses = this.getResponsesByQuestionnaire(questionnaireId);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentResponses = questionnaireResponses.filter(
      r => r.submittedAt > oneDayAgo
    ).length;

    return {
      totalResponses: questionnaireResponses.length,
      recentResponses
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 生成分享連結
  generateShareLink(questionnaireId: string): string {
    return `${window.location.origin}${window.location.pathname}#/fill/${questionnaireId}`;
  }

  getPublishedQuestionnaires(): Questionnaire[] {
    return this.questionnaires.filter(q => q.published);
  }

  getQuestionnaireStatus(questionnaire: Questionnaire): '未發布' | '尚未開始' | '進行中' | '已關閉' {
    if (!questionnaire.published) {
      return '未發布';
    }

    const now = new Date();
    if (questionnaire.startAt && now < new Date(questionnaire.startAt)) {
      return '尚未開始';
    }
    if (questionnaire.endAt && now > new Date(questionnaire.endAt)) {
      return '已關閉';
    }
    return '進行中';
  }

  isQuestionnaireActive(questionnaire: Questionnaire): boolean {
    return this.getQuestionnaireStatus(questionnaire) === '進行中';
  }
}
