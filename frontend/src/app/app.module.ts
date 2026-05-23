import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { AppComponent } from './app.component';
import { ParcelStressComponent } from './components/parcel-stress/parcel-stress.component';
import { ParcelMapComponent } from './components/parcel-map/parcel-map.component';

// Services
import { StressService } from './services/stress.service';
import { ParcelService } from './services/parcel.service';

@NgModule({
  declarations: [
    AppComponent,
    ParcelStressComponent,
    ParcelMapComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    StressService,
    ParcelService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
