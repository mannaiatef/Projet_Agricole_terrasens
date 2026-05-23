import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DiseaseDetectionRoutingModule } from './disease-detection-routing.module';
import { DiseaseUploadComponent } from './components/disease-upload.component';
import { DiseaseHistoryComponent } from './components/disease-history.component';

/**
 * DiseaseDetectionModule
 * Feature module for crop disease detection functionality
 */
@NgModule({
  declarations: [
    DiseaseUploadComponent,
    DiseaseHistoryComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    DiseaseDetectionRoutingModule
  ],
  exports: [
    DiseaseUploadComponent,
    DiseaseHistoryComponent
  ]
})
export class DiseaseDetectionModule { }
