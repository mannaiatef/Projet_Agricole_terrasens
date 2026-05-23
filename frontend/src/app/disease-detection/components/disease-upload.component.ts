import { Component, OnInit } from '@angular/core';
import { DiseaseDetectionService } from '../services/disease-detection.service';
import { DiseaseTranslationService } from '../services/disease-translation.service';

/**
 * DiseaseUploadComponent
 * Handles image upload with preview and disease analysis
 */
@Component({
  selector: 'app-disease-upload',
  templateUrl: './disease-upload.component.html',
  styleUrls: ['./disease-upload.component.css']
})
export class DiseaseUploadComponent implements OnInit {
  // File and preview
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragOver = false;

  // Analysis state
  isAnalyzing = false;
  analysisResult: any = null;
  analysisError: string | null = null;

  // Optional fields
  selectedParcelId: number | null = null;

  constructor(
    private diseaseService: DiseaseDetectionService,
    public translator: DiseaseTranslationService
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(): void {
    this.isDragOver = false;
  }

  /**
   * Handle drop event
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  /**
   * Process selected file (validate and create preview)
   */
  private processFile(file: File): void {
    this.analysisError = null;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.analysisError = 'Only JPG and PNG images are allowed';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.analysisError = 'File size exceeds 5MB limit';
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Submit image for disease analysis
   */
  analyzeImage(): void {
    if (!this.selectedFile) {
      this.analysisError = 'Please select an image first';
      return;
    }

    this.isAnalyzing = true;
    this.analysisError = null;
    this.analysisResult = null;

    // Create form data
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    
    if (this.selectedParcelId) {
      formData.append('parcelId', this.selectedParcelId.toString());
    }

    // Send to backend
    this.diseaseService.analyzeImage(formData).subscribe({
      next: (response) => {
        this.isAnalyzing = false;
        
        if (response.success) {
          this.analysisResult = response.data;
        } else {
          this.analysisError = response.error?.message || 'Analysis failed';
        }
      },
      error: (error) => {
        this.isAnalyzing = false;
        
        if (error.status === 413) {
          this.analysisError = 'File size exceeds 5MB limit';
        } else if (error.status === 400) {
          this.analysisError = error.error?.error?.message || 'Invalid image';
        } else if (error.status === 503) {
          this.analysisError = 'AI service temporarily unavailable. Please try again later.';
        } else {
          this.analysisError = error.error?.error?.message || 'Analysis failed. Please try again.';
        }
      }
    });
  }

  /**
   * Clear selected file and results
   */
  clearSelection(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.analysisResult = null;
    this.analysisError = null;
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
   * Get urgency badge style
   */
  getUrgencyBadgeClass(urgency: string): string {
    return urgency.toLowerCase();
  }
}
