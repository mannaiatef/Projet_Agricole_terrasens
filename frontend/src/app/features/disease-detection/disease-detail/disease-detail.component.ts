import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DiseaseDetectionService, DiseaseAnalysis } from '../../../services/disease-detection.service';

@Component({
  selector: 'app-disease-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './disease-detail.component.html',
  styleUrls: ['./disease-detail.component.css']
})
export class DiseaseDetailComponent implements OnInit {
  analysis: DiseaseAnalysis | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private diseaseDetectionService: DiseaseDetectionService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const analysisId = params['analysisId'];
      if (analysisId) {
        this.loadAnalysisDetails(analysisId);
      }
    });
  }

  loadAnalysisDetails(analysisId: string): void {
    this.diseaseDetectionService.getAnalysisDetails(analysisId).subscribe({
      next: (analysisData) => {
        // Service already returns properly typed DiseaseAnalysis
        this.analysis = {
          id: analysisData.id,
          userId: analysisData.userId,
          parcelId: analysisData.parcelId,
          imageUrl: analysisData.imageUrl,
          detectedDiseases: analysisData.detectedDiseases || [],
          recommendations: analysisData.recommendations || {
            pesticide: '',
            organic: '',
            preventive: '',
            method: ''
          },
          analysisDate: analysisData.analysisDate || new Date(),
          status: analysisData.status || 'completed'
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading analysis details:', error);
        this.errorMessage = 'Failed to load analysis details';
        this.isLoading = false;
      }
    });
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'high': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  getSeverityBgColor(severity: string): string {
    switch (severity) {
      case 'low': return '#e8f5e9';
      case 'medium': return '#fff3e0';
      case 'high': return '#ffe0b2';
      case 'critical': return '#ffebee';
      default: return '#f5f5f5';
    }
  }

  goBack(): void {
    window.history.back();
  }
}
