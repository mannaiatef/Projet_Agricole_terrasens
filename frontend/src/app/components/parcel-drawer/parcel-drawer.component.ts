/**
 * Parcel Drawing Component
 * Interactive map-based parcel drawing with automatic area calculation
 */

import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapDrawingService, ParcelDrawData } from '../../services/map-drawing.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-parcel-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parcel-drawer.component.html',
  styleUrls: ['./parcel-drawer.component.css']
})
export class ParcelDrawerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  @Input() defaultCenter: [number, number] = [35.3, -2.9]; // Morocco center
  @Input() defaultZoom: number = 6;
  @Input() editMode: boolean = false;
  @Input() initialGeometry: any = null;

  @Output() geometryDrawn = new EventEmitter<ParcelDrawData>();
  @Output() geometryCleared = new EventEmitter<void>();

  parcelData: ParcelDrawData | null = null;
  isMapReady = false;
  areaUnit = 'hectares'; // hectares or m²
  instructions = {
    draw: 'Click on the map to create polygon points. Click the first point again to close the polygon.',
    edit: 'Drag points to edit the polygon. Right-click on points to delete them.',
    help: 'Use the drawing tools in the top-left corner to create or edit parcels.'
  };

  private destroy$ = new Subject<void>();

  constructor(private mapDrawingService: MapDrawingService) {}

  ngOnInit(): void {
    // Subscribe to geometry changes
    this.mapDrawingService.parcelDrawData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ParcelDrawData | null) => {
        this.parcelData = data;
        if (data) {
          this.geometryDrawn.emit(data);
        }
      });
  }

  ngAfterViewInit(): void {
    // Wait for DOM layout to complete before initializing map
    // Increased delay to ensure parent modal is fully rendered
    setTimeout(() => {
      console.log('Initializing map...');
      console.log('MapContainer element:', this.mapContainer?.nativeElement);
      console.log('Container dimensions:', {
        offsetWidth: this.mapContainer?.nativeElement?.offsetWidth,
        offsetHeight: this.mapContainer?.nativeElement?.offsetHeight,
        clientWidth: this.mapContainer?.nativeElement?.clientWidth,
        clientHeight: this.mapContainer?.nativeElement?.clientHeight
      });
      this.initializeMap();
    }, 500);
  }

  /**
   * Initialize the map with drawing tools
   */
  private initializeMap(): void {
    try {
      this.mapDrawingService.initializeMap(
        this.mapContainer.nativeElement,
        this.defaultCenter,
        this.defaultZoom
      );
      this.isMapReady = true;

      // If in edit mode with initial geometry, display it
      if (this.initialGeometry) {
        this.mapDrawingService.displayParcelGeometry(this.initialGeometry);
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  /**
   * Clear all drawn items
   */
  clearDrawing(): void {
    this.mapDrawingService.clearDrawing();
    this.parcelData = null;
    this.geometryCleared.emit();
  }

  /**
   * Get the formatted area in selected units
   */
  getFormattedArea(): string {
    if (!this.parcelData) return '-';

    const areaM2 = this.parcelData.area;
    if (this.areaUnit === 'hectares') {
      return (areaM2 / 10000).toFixed(2) + ' ha';
    } else {
      return areaM2.toFixed(2) + ' m²';
    }
  }

  /**
   * Get center coordinates as [lat, lon]
   */
  getCenterCoordinates(): [number, number] | null {
    return this.parcelData?.center || null;
  }

  /**
   * Check if parcel has been drawn
   */
  hasParcelDrawn(): boolean {
    return this.parcelData != null;
  }

  /**
   * Toggle area unit
   */
  toggleAreaUnit(): void {
    this.areaUnit = this.areaUnit === 'hectares' ? 'm²' : 'hectares';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapDrawingService.destroyMap();
  }
}
