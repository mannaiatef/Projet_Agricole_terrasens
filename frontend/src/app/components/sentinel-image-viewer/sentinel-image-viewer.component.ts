import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SentinelHubService } from '../../services/sentinel-hub.service';
import {
  ImageType,
  NDVILegend,
  FieldInfo,
  SentinelImageMetadata,
  ColorScaleItem
} from '../../models/sentinel-hub.model';

@Component({
  selector: 'app-sentinel-image-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sentinel-image-viewer.component.html',
  styleUrls: ['./sentinel-image-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentinelImageViewerComponent implements OnInit, OnDestroy {
  @Input() fieldId!: number;
  @ViewChild('imageContainer') imageContainer!: ElementRef;

  // State
  currentImageType: ImageType = 'NDVI';
  imageUrl: string | null = null;
  isLoading = false;
  error: string | null = null;
  imageAcquisitionDate: string | null = null;
  cloudCoverage: number | null = null;

  // Field and metadata
  fieldInfo: FieldInfo | null = null;
  legend: NDVILegend | null = null;
  isZoomed = false;
  currentZoom = 1;
  panX = 0;
  panY = 0;

  private destroy$ = new Subject<void>();
  private currentObjectUrl: string | null = null;

  imageTypes: ImageType[] = ['NDVI', 'TrueColor', 'Moisture'];

  constructor(
    private sentinelHubService: SentinelHubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.fieldId) {
      this.error = 'Field ID is required';
      return;
    }

    this.initializeViewer();
  }

  /**
   * Initialize the viewer with field info and load initial image
   */
  private initializeViewer(): void {
    this.loadFieldInfo();
    this.loadNDVILegend();
    this.loadImage(this.currentImageType);
  }

  /**
   * Load field information
   */
  private loadFieldInfo(): void {
    this.sentinelHubService
      .getFieldInfo(this.fieldId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fieldInfo) => {
          this.fieldInfo = fieldInfo;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading field info:', error);
          this.error = 'Failed to load field information';
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Load NDVI legend
   */
  private loadNDVILegend(): void {
    this.sentinelHubService
      .getNDVILegend()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (legend) => {
          this.legend = legend;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading legend:', error);
        }
      });
  }

  /**
   * Load satellite image
   * @param imageType - Type of image to load
   */
  loadImage(imageType: ImageType): void {
    // Clean up previous image
    if (this.currentObjectUrl) {
      this.sentinelHubService.releaseObjectUrl(this.currentObjectUrl);
    }

    this.isLoading = true;
    this.error = null;
    this.imageUrl = null;
    this.currentImageType = imageType;
    this.resetZoom();

    this.sentinelHubService
      .getFieldImage(this.fieldId, imageType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.imageUrl = this.sentinelHubService.blobToObjectUrl(blob);
          this.currentObjectUrl = this.imageUrl;
          this.isLoading = false;
          this.cdr.markForCheck();

          // Load metadata
          this.loadImageMetadata();
        },
        error: (error) => {
          this.isLoading = false;
          this.error = error.message || 'Failed to load satellite image';
          this.cdr.markForCheck();
          console.error('Error loading image:', error);
        }
      });
  }

  /**
   * Load image metadata
   */
  private loadImageMetadata(): void {
    this.sentinelHubService
      .getImageMetadata(this.fieldId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metadata) => {
          this.imageAcquisitionDate = metadata.metadata.lastUpdated;
          this.cloudCoverage = metadata.metadata.lastUpdated ? 0 : null;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading metadata:', error);
        }
      });
  }

  /**
   * Refresh the current image
   */
  refreshImage(): void {
    this.loadImage(this.currentImageType);
  }

  /**
   * Download the current image
   */
  downloadImage(): void {
    const imageType = this.currentImageType;

    this.sentinelHubService
      .downloadImage(this.fieldId, imageType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = this.sentinelHubService.blobToObjectUrl(blob);
          const link = document.createElement('a');
          link.href = url;
          const timestamp = new Date().toISOString().split('T')[0];
          link.download = `satellite-${imageType}-${timestamp}.png`;
          link.click();
          this.sentinelHubService.releaseObjectUrl(url);
        },
        error: (error) => {
          this.error = 'Failed to download image: ' + error.message;
          this.cdr.markForCheck();
          console.error('Error downloading image:', error);
        }
      });
  }

  /**
   * Switch image type
   * @param imageType - New image type
   */
  switchImageType(imageType: ImageType): void {
    if (imageType !== this.currentImageType) {
      this.loadImage(imageType);
    }
  }

  /**
   * Handle zoom
   */
  handleZoom(event: WheelEvent): void {
    event.preventDefault();

    if (!this.imageUrl) return;

    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.currentZoom * delta;

    // Clamp zoom between 1 and 3
    if (newZoom >= 1 && newZoom <= 3) {
      this.currentZoom = newZoom;
      this.isZoomed = this.currentZoom > 1;
    }
  }

  /**
   * Handle mouse drag for panning
   */
  handleMouseDown(event: MouseEvent): void {
    if (!this.isZoomed) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const initialPanX = this.panX;
    const initialPanY = this.panY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      this.panX = initialPanX + (moveEvent.clientX - startX);
      this.panY = initialPanY + (moveEvent.clientY - startY);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Handle double click to reset zoom
   */
  handleDoubleClick(): void {
    this.resetZoom();
  }

  /**
   * Reset zoom and pan
   */
  private resetZoom(): void {
    this.isZoomed = false;
    this.currentZoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  /**
   * Get transform style for zoomed image
   */
  getImageTransformStyle(): string {
    if (!this.isZoomed) {
      return '';
    }
    return `scale(${this.currentZoom}) translate(${this.panX}px, ${this.panY}px)`;
  }

  /**
   * Get cursor style based on zoom state
   */
  getCursorStyle(): string {
    if (!this.imageUrl) return 'default';
    if (this.isZoomed) return 'grab';
    return 'zoom-in';
  }

  /**
   * Get icon for image type
   */
  getImageTypeIcon(type: ImageType): string {
    switch (type) {
      case 'NDVI':
        return '🟢';
      case 'TrueColor':
        return '🌍';
      case 'Moisture':
        return '💧';
      default:
        return '📡';
    }
  }

  ngOnDestroy(): void {
    // Clean up
    if (this.currentObjectUrl) {
      this.sentinelHubService.releaseObjectUrl(this.currentObjectUrl);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }







  
}
