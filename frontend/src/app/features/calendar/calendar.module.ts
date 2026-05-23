import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CalendarRoutingModule } from './calendar-routing.module';
import { CropCalendarComponent } from './crop-calendar.component';

@NgModule({
  declarations: [
    //CropCalendarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    CalendarRoutingModule,
    CropCalendarComponent
  ]
})
export class CalendarModule { }
