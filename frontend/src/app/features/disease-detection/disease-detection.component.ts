import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DiseaseDetectionService, AnalysisHistory, DiseaseStatistics } from '../../services/disease-detection.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-disease-detection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './disease-detection.component.html',
  styleUrls: ['./disease-detection.component.css']
})
export class DiseaseDetectionComponent implements OnInit {
  // Upload & Analysis
  selectedFile: File | null = null;
  selectedParcelId: string = '';
  isAnalyzing: boolean = false;
  analysisProgress: number = 0;
  previewImageUrl: string | ArrayBuffer | null = null;

  // History & Data
  analysisHistory: AnalysisHistory[] = [];
  statistics: DiseaseStatistics | null = null;
  highRiskAnalyses: any[] = [];
  
  // Response handling
  isLoadingHistory: boolean = false;
  isLoadingStatistics: boolean = false;
  isLoadingHighRisk: boolean = false;

  // UI State
  activeTab: 'upload' | 'history' | 'statistics' | 'high-risk' = 'upload';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  isAuthenticated: boolean = false;

  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private diseaseDetectionService: DiseaseDetectionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    
    if (this.isAuthenticated) {
      this.loadAnalysisHistory();
      this.loadStatistics();
      this.loadHighRiskAnalyses();
    } else {
      this.errorMessage = '🔒 Please log in first to access disease detection features';
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = '❌ Please select a valid image file (JPEG, PNG)';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5242880) {
        this.errorMessage = '❌ Image size should not exceed 5MB';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
      this.successMessage = '';

      // Create preview image using FileReader
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Handle drag and drop
   */
  onDragOver(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
  }

  onDragLeave(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
  }

  onDrop(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');

    const files: FileList = event.dataTransfer.files;
    if (files && files.length > 0) {
      this.onFileSelected({ target: { files } });
    }
  }

  /**
   * Analyze image
   */
  analyzeImage(): void {
    if (!this.isAuthenticated) {
      this.errorMessage = '🔒 Please log in first to analyze images';
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage = '❌ Please select an image file';
      return;
    }

    this.isAnalyzing = true;
    this.analysisProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (this.analysisProgress < 90) {
        this.analysisProgress += Math.random() * 20;
      }
    }, 500);

    this.diseaseDetectionService.analyzeImage(
      this.selectedFile,
      this.selectedParcelId || undefined
    ).subscribe({
      next: (result) => {
        clearInterval(progressInterval);
        this.analysisProgress = 100;
        this.isAnalyzing = false;

        const diseaseCount = result?.detectedDiseases?.length || 1;
        this.successMessage = `✅ Analysis complete! ${diseaseCount} disease(s) detected.`;
        this.selectedFile = null;

        // Reset form
        setTimeout(() => {
          this.loadAnalysisHistory();
          this.activeTab = 'history';
        }, 1500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isAnalyzing = false;
        this.errorMessage = `❌ Analysis failed: ${error.error?.error?.message || 'Unknown error'}`;
      }
    });
  }

  /**
   * Load analysis history
   */
  loadAnalysisHistory(): void {
    this.isLoadingHistory = true;
    this.diseaseDetectionService.getAnalysisHistory(this.currentPage, this.itemsPerPage).subscribe({
      next: (result) => {
        this.analysisHistory = result?.analyses || [];
        this.totalItems = result?.total || 0;
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Failed to load history:', error);
        this.analysisHistory = [];
        this.totalItems = 0;
        this.isLoadingHistory = false;
      }
    });
  }

  /**
   * Load statistics
   */
  loadStatistics(): void {
    this.isLoadingStatistics = true;
    this.diseaseDetectionService.getStatistics().subscribe({
      next: (result) => {
        this.statistics = result || this.getDefaultStatistics();
        this.isLoadingStatistics = false;
      },
      error: (error) => {
        console.error('Failed to load statistics:', error);
        this.statistics = this.getDefaultStatistics();
        this.isLoadingStatistics = false;
      }
    });
  }

  /**
   * Load high-risk analyses
   */
  loadHighRiskAnalyses(): void {
    this.isLoadingHighRisk = true;
    this.diseaseDetectionService.getHighRiskDetections().subscribe({
      next: (result) => {
        this.highRiskAnalyses = result?.highRiskAnalyses || [];
        this.isLoadingHighRisk = false;
      },
      error: (error) => {
        console.error('Failed to load high-risk analyses:', error);
        this.highRiskAnalyses = [];
        this.isLoadingHighRisk = false;
      }
    });
  }

  /**
   * Delete analysis
   */
  deleteAnalysis(analysisId: string): void {
    if (confirm('Are you sure you want to delete this analysis?')) {
      this.diseaseDetectionService.deleteAnalysis(analysisId).subscribe({
        next: () => {
          this.successMessage = '✅ Analysis deleted successfully';
          this.loadAnalysisHistory();
        },
        error: (error) => {
          this.errorMessage = '❌ Failed to delete analysis';
        }
      });
    }
  }

  /**
   * Switch tab
   */
  switchTab(tab: 'upload' | 'history' | 'statistics' | 'high-risk'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';

    if (tab === 'history') {
      this.loadAnalysisHistory();
    } else if (tab === 'statistics') {
      this.loadStatistics();
    } else if (tab === 'high-risk') {
      this.loadHighRiskAnalyses();
    }
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'high': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  /**
   * Get severity icon
   */
  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'low': return '✓';
      case 'medium': return '⚠';
      case 'high': return '⚠⚠';
      case 'critical': return '🚨';
      default: return '—';
    }
  }

  /**
   * Paginate history
   */
  goToPage(page: number): void {
    this.currentPage = page;
    this.loadAnalysisHistory();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * Get default statistics structure
   */
  private getDefaultStatistics(): DiseaseStatistics {
    return {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      commonDiseases: [],
      severityDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };
  }
}
