import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuestionnaireService } from '../services/questionnaire.service';
import { Questionnaire, QuestionnaireResponse, Question, QuestionType } from '../models/questionnaire.models';

@Component({
  selector: 'app-questionnaire-results',
  imports: [CommonModule, RouterLink],
  templateUrl: './questionnaire-results.component.html',
  styleUrl: './questionnaire-results.component.scss'
})
export class QuestionnaireResultsComponent implements OnInit {
  questionnaire: Questionnaire | undefined;
  responses: QuestionnaireResponse[] = [];
  stats: { totalResponses: number; recentResponses: number } = { totalResponses: 0, recentResponses: 0 };
  hasError = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    const questionnaireId = this.route.snapshot.paramMap.get('id');

    if (!questionnaireId) {
      this.hasError = true;
      this.errorMessage = '問卷ID不存在';
      return;
    }

    this.questionnaire = this.questionnaireService.getQuestionnaire(questionnaireId);

    if (!this.questionnaire) {
      this.hasError = true;
      this.errorMessage = '找不到此問卷';
      return;
    }

    this.responses = this.questionnaireService.getResponsesByQuestionnaire(questionnaireId);
    this.stats = this.questionnaireService.getQuestionnaireStats(questionnaireId);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getResponseText(question: Question, response: { [questionId: string]: string | string[] }): string {
    const answer = response[question.id];

    if (Array.isArray(answer)) {
      return answer.join('、');
    }

    return answer || '未回答';
  }

  getResponseCount(question: Question): { [option: string]: number } {
    const counts: { [option: string]: number } = {};

    if (!question.options) return counts;

    // 初始化所有選項為 0
    for (const option of question.options) {
      counts[option] = 0;
    }

    // 統計每個選項的次數
    for (const response of this.responses) {
      const answer = response.responses[question.id];

      if (Array.isArray(answer)) {
        for (const ans of answer) {
          if (counts[ans] !== undefined) {
            counts[ans]++;
          }
        }
      } else if (answer && counts[answer] !== undefined) {
        counts[answer]++;
      }
    }

    return counts;
  }

  getPercentage(count: number): number {
    if (this.responses.length === 0) return 0;
    return Math.round((count / this.responses.length) * 100);
  }

  getTypeLabel(type: QuestionType): string {
    const labels: { [key in QuestionType]: string } = {
      text: '文字題',
      choice: '選擇題',
      radio: '單選題',
      checkbox: '複選題'
    };
    return labels[type];
  }

  getBarGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    return gradients[index % gradients.length];
  }

  goBack(): void {
    window.history.back();
  }
}
