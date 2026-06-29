import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuestionnaireService } from '../services/questionnaire.service';
import { Questionnaire } from '../models/questionnaire.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-questionnaire-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './questionnaire-list.component.html',
  styleUrl: './questionnaire-list.component.scss'
})
export class QuestionnaireListComponent implements OnInit {
  questionnaires: Questionnaire[] = [];
  filteredQuestionnaires: Questionnaire[] = [];
  displayedQuestionnaires: Questionnaire[] = [];
  searchText = '';
  startDate = '';
  endDate = '';
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;

  constructor(private questionnaireService: QuestionnaireService) {}

  ngOnInit(): void {
    this.questionnaires = this.questionnaireService.getPublishedQuestionnaires();
    this.applyFilters();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateShort(date: Date | null | undefined): string {
    if (!date) {
      return '-';
    }
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getStats(questionnaireId: string): { totalResponses: number; recentResponses: number } {
    return this.questionnaireService.getQuestionnaireStats(questionnaireId);
  }

  canFill(questionnaire: Questionnaire): boolean {
    return this.questionnaireService.isQuestionnaireActive(questionnaire);
  }

  getStatus(questionnaire: Questionnaire): string {
    return this.questionnaireService.getQuestionnaireStatus(questionnaire);
  }

  trackById(index: number, questionnaire: Questionnaire): string {
    return questionnaire.id;
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

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    const normalizedSearch = this.searchText.trim().toLowerCase();
    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;

    this.filteredQuestionnaires = this.questionnaires.filter(q => {
      const titleMatch = normalizedSearch
        ? q.title.toLowerCase().includes(normalizedSearch)
        : true;

      const questionnaireStart = q.startAt ? new Date(q.startAt) : null;
      const questionnaireEnd = q.endAt ? new Date(q.endAt) : null;

      let startMatch = true;
      let endMatch = true;

      if (start) {
        startMatch = questionnaireStart ? questionnaireStart >= start : false;
      }

      if (end) {
        endMatch = questionnaireEnd ? questionnaireEnd <= end : false;
      }

      return titleMatch && startMatch && endMatch;
    });

    this.totalPages = Math.max(1, Math.ceil(this.filteredQuestionnaires.length / this.pageSize));
    this.updateDisplayedQuestionnaires();
  }

  updateDisplayedQuestionnaires(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.displayedQuestionnaires = this.filteredQuestionnaires.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.updateDisplayedQuestionnaires();
  }
}

