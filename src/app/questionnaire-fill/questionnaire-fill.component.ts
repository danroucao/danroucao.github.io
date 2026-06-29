import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuestionnaireService } from '../services/questionnaire.service';
import { Questionnaire, Question } from '../models/questionnaire.models';

@Component({
  selector: 'app-questionnaire-fill',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './questionnaire-fill.component.html',
  styleUrl: './questionnaire-fill.component.scss'
})
export class QuestionnaireFillComponent implements OnInit {
  questionnaire: Questionnaire | undefined;
  responses: { [questionId: string]: string | string[] } = {};
  isSubmitted = false;
  hasError = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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

    if (!this.questionnaireService.isQuestionnaireActive(this.questionnaire)) {
      this.hasError = true;
      this.errorMessage = '此問卷目前無法填寫，請選擇進行中的問卷。';
      return;
    }

    // 檢查是否已填寫過
    if (this.questionnaireService.hasResponded(questionnaireId)) {
      this.isSubmitted = true;
    }

    // 初始化回應
    for (const question of this.questionnaire.questions) {
      if (question.type === 'checkbox') {
        this.responses[question.id] = [];
      } else {
        this.responses[question.id] = '';
      }
    }
  }

  onCheckboxChange(questionId: string, option: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!Array.isArray(this.responses[questionId])) {
      this.responses[questionId] = [];
    }

    const currentResponses = this.responses[questionId] as string[];
    if (input.checked) {
      currentResponses.push(option);
    } else {
      const index = currentResponses.indexOf(option);
      if (index > -1) {
        currentResponses.splice(index, 1);
      }
    }
  }

  validateForm(): boolean {
    if (!this.questionnaire) return false;

    for (const question of this.questionnaire.questions) {
      const response = this.responses[question.id];

      if (question.required) {
        if (Array.isArray(response)) {
          if (response.length === 0) {
            alert(`請回答：${question.title}`);
            return false;
          }
        } else if (!response || response.trim() === '') {
          alert(`請回答：${question.title}`);
          return false;
        }
      }
    }
    return true;
  }

  submitForm(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.questionnaire) return;

    this.questionnaireService.submitResponse(this.questionnaire.id, this.responses);
    this.questionnaireService.setResponded(this.questionnaire.id);
    this.isSubmitted = true;
  }

  trackByQuestionId(index: number, question: Question): string {
    return question.id;
  }

  goBack(): void {
    this.router.navigate(['/questionnaires']);
  }
}
