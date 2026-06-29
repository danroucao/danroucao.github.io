import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionnaireService } from '../services/questionnaire.service';
import { Questionnaire, Question, QuestionType } from '../models/questionnaire.models';

type QuestionTemplate = {
  type: QuestionType;
  label: string;
  description: string;
  icon: string;
};

@Component({
  selector: 'app-questionnaire-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './questionnaire-editor.component.html',
  styleUrl: './questionnaire-editor.component.scss'
})
export class QuestionnaireEditorComponent implements OnInit {
  questionnaire: Partial<Questionnaire> = {
    title: '',
    description: '',
    questions: [],
    published: false,
    startAt: null,
    endAt: null,
    isActive: false
  };

  startAtValue = '';
  endAtValue = '';
  isEditMode = false;
  questionnaireId: string | null = null;
  draggedQuestionId: string | null = null;

  questionTemplates: QuestionTemplate[] = [
    {
      type: 'text',
      label: '單行文字題',
      description: '適合姓名、Email、簡短回答',
      icon: 'T'
    },
    {
      type: 'radio',
      label: '單選題',
      description: '受填者只能選擇一個答案',
      icon: '○'
    },
    {
      type: 'checkbox',
      label: '複選題',
      description: '受填者可以選擇多個答案',
      icon: '☑'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    this.questionnaireId = this.route.snapshot.paramMap.get('id');

    if (this.questionnaireId) {
      this.isEditMode = true;
      const existing = this.questionnaireService.getQuestionnaire(this.questionnaireId);
      if (existing) {
        this.questionnaire = {
          ...existing,
          questions: existing.questions.map(question => ({ ...question }))
        };
        this.startAtValue = existing.startAt ? this.formatDateInput(existing.startAt) : '';
        this.endAtValue = existing.endAt ? this.formatDateInput(existing.endAt) : '';
      } else {
        this.router.navigate(['/questionnaires']);
      }
    }
  }

  addQuestion(type: QuestionType = 'text'): void {
    const newQuestion: Question = {
      id: this.generateId(),
      type,
      title: '',
      required: false,
      ...(this.needsOptions(type) ? { options: ['選項 1', '選項 2'] } : {})
    };

    this.ensureQuestions().push(newQuestion);
  }

  removeQuestion(questionId: string): void {
    if (!this.questionnaire.questions) return;
    this.questionnaire.questions = this.questionnaire.questions.filter(question => question.id !== questionId);
  }

  onQuestionTypeChange(question: Question): void {
    if (this.needsOptions(question.type)) {
      question.options = question.options && question.options.length > 0 ? question.options : ['選項 1', '選項 2'];
      return;
    }

    delete question.options;
  }

  addOption(question: Question): void {
    if (!question.options) {
      question.options = [];
    }
    question.options.push(`選項 ${question.options.length + 1}`);
  }

  removeOption(question: Question, index: number): void {
    question.options?.splice(index, 1);
  }

  onDragStart(questionId: string): void {
    this.draggedQuestionId = questionId;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(targetQuestionId: string): void {
    if (!this.draggedQuestionId || this.draggedQuestionId === targetQuestionId || !this.questionnaire.questions) {
      this.draggedQuestionId = null;
      return;
    }

    const questions = [...this.questionnaire.questions];
    const fromIndex = questions.findIndex(question => question.id === this.draggedQuestionId);
    const toIndex = questions.findIndex(question => question.id === targetQuestionId);

    if (fromIndex === -1 || toIndex === -1) {
      this.draggedQuestionId = null;
      return;
    }

    const [movedQuestion] = questions.splice(fromIndex, 1);
    questions.splice(toIndex, 0, movedQuestion);
    this.questionnaire.questions = questions;
    this.draggedQuestionId = null;
  }

  onDragEnd(): void {
    this.draggedQuestionId = null;
  }

  trackByQuestionId(index: number, question: Question): string {
    return question.id;
  }

  saveQuestionnaire(): void {
    if (!this.questionnaire.title?.trim()) {
      alert('請輸入問卷標題');
      return;
    }

    if (!this.questionnaire.questions || this.questionnaire.questions.length === 0) {
      alert('請至少新增一個題目');
      return;
    }

    for (const question of this.questionnaire.questions) {
      if (!question.title.trim()) {
        alert('請填寫每個題目的標題');
        return;
      }

      if (this.needsOptions(question.type)) {
        if (!question.options || question.options.length < 2) {
          alert('單選題與複選題至少需要兩個選項');
          return;
        }

        if (question.options.some(option => !option.trim())) {
          alert('請填寫所有選項內容');
          return;
        }
      }
    }

    const questionnaireToSave: Partial<Questionnaire> = {
      ...this.questionnaire,
      published: this.questionnaire.published ?? false,
      startAt: this.parseDateInput(this.startAtValue),
      endAt: this.parseDateInput(this.endAtValue)
    };

    questionnaireToSave.isActive = this.questionnaireService.isQuestionnaireActive(questionnaireToSave as Questionnaire);

    if (this.isEditMode && this.questionnaireId) {
      this.questionnaireService.updateQuestionnaire(this.questionnaireId, questionnaireToSave as Questionnaire);
      alert('問卷已更新');
    } else {
      this.questionnaireService.createQuestionnaire(questionnaireToSave as Omit<Questionnaire, 'id' | 'createdAt' | 'updatedAt'>);
      alert('問卷已建立');
    }

    this.router.navigate(['/questionnaires']);
  }

  cancel(): void {
    this.router.navigate(['/questionnaires']);
  }

  getTypeLabel(type: QuestionType): string {
    const labels: { [key in QuestionType]: string } = {
      text: '單行文字題',
      choice: '選擇題',
      radio: '單選題',
      checkbox: '複選題'
    };
    return labels[type];
  }

  private ensureQuestions(): Question[] {
    if (!this.questionnaire.questions) {
      this.questionnaire.questions = [];
    }
    return this.questionnaire.questions;
  }

  private formatDateInput(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private parseDateInput(value: string): Date | null {
    return value ? new Date(value) : null;
  }

  private needsOptions(type: QuestionType): boolean {
    return type === 'radio' || type === 'checkbox' || type === 'choice';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
