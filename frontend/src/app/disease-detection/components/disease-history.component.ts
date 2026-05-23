import { Component, OnInit } from '@angular/core';
import { DiseaseDetectionService } from '../services/disease-detection.service';
import { DiseaseTranslationService } from '../services/disease-translation.service';

/**
 * DiseaseHistoryComponent
 * Displays analysis history and statistics
 */
@Component({
  selector: 'app-disease-history',
  templateUrl: './disease-history.component.html',
  styleUrls: ['./disease-history.component.css']
})
export class DiseaseHistoryComponent implements OnInit {
  historyData: any[] = [];
  statistics: any = null;
  isLoading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;
  
  // Filters
  filterByDisease: string | null = null;
  filterByConfidence: number = 0;

  constructor(
    private diseaseService: DiseaseDetectionService,
    public translator: DiseaseTranslationService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadStatistics();
  }

  /**
   * Load analysis history
   */
  loadHistory(): void {
    this.isLoading = true;
    this.error = null;

    const offset = (this.currentPage - 1) * this.pageSize;

    this.diseaseService.getAnalysisHistory(this.pageSize, offset).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          this.historyData = response.data || [];
          this.totalRecords = response.pagination?.total || 0;
        } else {
          this.error = response.error?.message || 'Failed to load history';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Failed to load analysis history';
        console.error('History load error:', err);
      }
    });
  }

  /**
   * Load disease statistics
   */
  loadStatistics(): void {
    this.diseaseService.getDiseaseStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics = response.data;
        }
      },
      error: (err) => {
        console.error('Statistics load error:', err);
      }
    });
  }

  /**
   * Delete an analysis
   */
  deleteAnalysis(analysisId: string): void {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    this.diseaseService.deleteAnalysis(analysisId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadHistory();
          this.loadStatistics();
        }
      },
      error: (err) => {
        this.error = 'Failed to delete analysis';
      }
    });
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadHistory();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    const totalPages = Math.ceil(this.totalRecords / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.loadHistory();
    }
  }

  /**
   * Get total pages
   */
  getTotalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  /**
   * Get confidence badge style
   */
  getConfidenceBadgeClass(confidence: number): string {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Check if analysis is uncertain
   */
  isUncertain(confidence: number): boolean {
    return confidence < 70;
  }
}
