import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuestionnaireService } from '../services/questionnaire.service';
import { Questionnaire } from '../models/questionnaire.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-questionnaire-backend',
  imports: [CommonModule, RouterLink],
  templateUrl: './questionnaire-backend.component.html',
  styleUrl: './questionnaire-backend.component.scss'
})
export class QuestionnaireBackendComponent {
  questionnaires: Questionnaire[] = [];

  constructor(private questionnaireService: QuestionnaireService) {}

  ngOnInit(): void {
    this.questionnaires = this.questionnaireService.getAllQuestionnaires();
  }

  // 回傳狀態字串：未發布、尚未開始、進行中、已關閉
  getStatus(q: Questionnaire): string {
    if (!q.published) return '未發布';

    const now = new Date();
    if (q.startAt && now < new Date(q.startAt)) return '尚未開始';
    if (q.endAt && now > new Date(q.endAt)) return '已關閉';

    return '進行中';
  }

  isEditable(q: Questionnaire): boolean {
    const status = this.getStatus(q);
    return status === '未發布' || status === '尚未開始';
  }

  isDeletable(q: Questionnaire): boolean {
    return this.isEditable(q);
  }

  canFill(q: Questionnaire): boolean {
    return this.getStatus(q) === '進行中';
  }

  trackById(index: number, q: Questionnaire) {
    return q.id;
  }

  deleteQuestionnaire(id: string): void {
    if (!confirm('確認要刪除此問卷嗎？此操作無法復原。')) return;

    const ok = this.questionnaireService.deleteQuestionnaire(id);
    if (ok) {
      this.questionnaires = this.questionnaireService.getAllQuestionnaires();
    } else {
      alert('刪除失敗，請稍後再試。');
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | null | undefined): string {
    if (!date) {
      return '-';
    }
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStats(questionnaireId: string): { totalResponses: number; recentResponses: number } {
    return this.questionnaireService.getQuestionnaireStats(questionnaireId);
  }

  copyShareLink(questionnaireId: string, event: Event): void {
    event.preventDefault();
    const link = this.questionnaireService.generateShareLink(questionnaireId);
    navigator.clipboard.writeText(link).then(() => {
      alert('分享連結已複製到剪貼簿！');
    }).catch(() => {
      alert('複製失敗，請手動複製');
    });
  }
}
